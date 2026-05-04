package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.TienIchDTO;
import com.example.WebApartment.Models.TienIch;
import com.example.WebApartment.Repository.BaiDangTienIchRepository;
import com.example.WebApartment.Repository.TienIchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TienIchService {

    private final TienIchRepository repo;
    private final BaiDangTienIchRepository baiDangTienIchRepo; // nhớ inject

    // ===== GET ALL =====
    public List<TienIchDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ===== GET BY ID =====
    public TienIchDTO getById(String ma) {
        TienIch entity = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tiện ích"));

        return toDto(entity);
    }

    // ===== CREATE =====
    public TienIchDTO create(TienIchDTO dto) {

        if (repo.existsByTenTienIch(dto.getTenTienIch())) {
            throw new RuntimeException("Tiện ích đã tồn tại");
        }

        TienIch entity = toEntity(dto);

        if (entity.getMaTienIch() == null) {
            entity.setMaTienIch(UUID.randomUUID().toString());
        }

        return toDto(repo.save(entity));
    }

    // ===== UPDATE =====
    public TienIchDTO update(String ma, TienIchDTO dto) {

        TienIch existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        if (dto.getTenTienIch() != null) {
            existing.setTenTienIch(dto.getTenTienIch());
        }

        return toDto(repo.save(existing));
    }

    // ===== DELETE =====
    public void delete(String ma) {

        TienIch existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        //check bảng trung gian
        if (baiDangTienIchRepo.existsByTienIch_MaTienIch(ma)) {
            throw new RuntimeException("Không thể xóa tiện ích đang được sử dụng");
        }

        repo.delete(existing);
    }

    // ===== MAPPER =====

    private TienIchDTO toDto(TienIch e) {
        return TienIchDTO.builder()
                .maTienIch(e.getMaTienIch())
                .tenTienIch(e.getTenTienIch())
                .build();
    }

    private TienIch toEntity(TienIchDTO dto) {
        return TienIch.builder()
                .maTienIch(dto.getMaTienIch())
                .tenTienIch(dto.getTenTienIch())
                .build();
    }
}