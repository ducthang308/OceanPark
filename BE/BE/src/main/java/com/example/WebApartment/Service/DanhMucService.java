package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.DanhMucDTO;
import com.example.WebApartment.Models.DanhMuc;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.DanhMucRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DanhMucService {

    private final DanhMucRepository repo;
    private final BaiDangRepository baiDangRepository;

    // ===== GET ALL =====
    public List<DanhMucDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ===== GET BY ID =====
    public DanhMucDTO getById(String ma) {
        DanhMuc entity = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        return toDto(entity);
    }

    // ===== CREATE =====
    public DanhMucDTO create(DanhMucDTO dto) {

        if (repo.existsByTenDanhMuc(dto.getTenDanhMuc())) {
            throw new RuntimeException("Danh mục đã tồn tại");
        }

        DanhMuc entity = toEntity(dto);

        if (entity.getMaDanhMuc() == null) {
            entity.setMaDanhMuc(UUID.randomUUID().toString());
        }

        return toDto(repo.save(entity));
    }

    // ===== UPDATE =====
    public DanhMucDTO update(String ma, DanhMucDTO dto) {

        DanhMuc existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        if (dto.getTenDanhMuc() != null) {
            existing.setTenDanhMuc(dto.getTenDanhMuc());
        }

        return toDto(repo.save(existing));
    }

    // ===== DELETE =====
    public void delete(String ma) {

        DanhMuc existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        if (baiDangRepository.existsByDanhMuc_MaDanhMuc(ma)) {
            throw new RuntimeException("Không thể xóa danh mục đang được sử dụng");
        }

        repo.delete(existing);
    }

    // ===== MAPPER =====

    private DanhMucDTO toDto(DanhMuc e) {
        return DanhMucDTO.builder()
                .maDanhMuc(e.getMaDanhMuc())
                .tenDanhMuc(e.getTenDanhMuc())
                .build();
    }

    private DanhMuc toEntity(DanhMucDTO dto) {
        return DanhMuc.builder()
                .maDanhMuc(dto.getMaDanhMuc())
                .tenDanhMuc(dto.getTenDanhMuc())
                .build();
    }
}