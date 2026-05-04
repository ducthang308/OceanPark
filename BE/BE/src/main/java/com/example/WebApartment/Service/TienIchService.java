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
    private final BaiDangTienIchRepository baiDangTienIchRepo;

    public List<TienIchDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TienIchDTO getById(String ma) {
        TienIch entity = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tiện ích"));

        return toDto(entity);
    }

    public TienIchDTO create(TienIchDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu tiện ích không hợp lệ");
        }

        if (dto.getTenTienIch() == null || dto.getTenTienIch().isBlank()) {
            throw new RuntimeException("Tên tiện ích không được để trống");
        }

        if (repo.existsByTenTienIch(dto.getTenTienIch())) {
            throw new RuntimeException("Tiện ích đã tồn tại");
        }

        TienIch entity = TienIch.builder()
                .maTienIch(
                        dto.getMaTienIch() == null || dto.getMaTienIch().isBlank()
                                ? UUID.randomUUID().toString()
                                : dto.getMaTienIch()
                )
                .tenTienIch(dto.getTenTienIch())
                .build();

        return toDto(repo.save(entity));
    }

    public TienIchDTO update(String ma, TienIchDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu cập nhật không hợp lệ");
        }

        TienIch existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tiện ích"));

        if (dto.getTenTienIch() != null && !dto.getTenTienIch().isBlank()) {
            if (!dto.getTenTienIch().equals(existing.getTenTienIch())
                    && repo.existsByTenTienIch(dto.getTenTienIch())) {
                throw new RuntimeException("Tiện ích đã tồn tại");
            }

            existing.setTenTienIch(dto.getTenTienIch());
        }

        return toDto(repo.save(existing));
    }

    public void delete(String ma) {
        TienIch existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tiện ích"));

        if (baiDangTienIchRepo.existsByTienIch_MaTienIch(ma)) {
            throw new RuntimeException("Không thể xóa tiện ích đang được sử dụng");
        }

        repo.delete(existing);
    }

    private TienIchDTO toDto(TienIch e) {
        if (e == null) return null;

        return TienIchDTO.builder()
                .maTienIch(e.getMaTienIch())
                .tenTienIch(e.getTenTienIch())
                .build();
    }
}