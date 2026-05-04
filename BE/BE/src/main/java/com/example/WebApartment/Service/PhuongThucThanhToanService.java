package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.PhuongThucThanhToanDTO;
import com.example.WebApartment.Models.PhuongThucThanhToan;
import com.example.WebApartment.Repository.PhuongThucThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhuongThucThanhToanService {

    private final PhuongThucThanhToanRepository repo;

    // ===== GET ALL =====
    public List<PhuongThucThanhToanDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ===== GET BY ID =====
    public PhuongThucThanhToanDTO getById(String ma) {
        PhuongThucThanhToan entity = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương thức thanh toán"));

        return toDto(entity);
    }

    // ===== CREATE =====
    public PhuongThucThanhToanDTO create(PhuongThucThanhToanDTO dto) {

        if (repo.existsByTenPhuongThucThanhToan(dto.getTenPhuongThucThanhToan())) {
            throw new RuntimeException("Phương thức đã tồn tại");
        }

        PhuongThucThanhToan entity = toEntity(dto);

        if (entity.getMaPhuongThucThanhToan() == null) {
            entity.setMaPhuongThucThanhToan(UUID.randomUUID().toString());
        }

        return toDto(repo.save(entity));
    }

    // ===== UPDATE =====
    public PhuongThucThanhToanDTO update(String ma, PhuongThucThanhToanDTO dto) {

        PhuongThucThanhToan existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        if (dto.getTenPhuongThucThanhToan() != null) {
            existing.setTenPhuongThucThanhToan(dto.getTenPhuongThucThanhToan());
        }

        if (dto.getMoTa() != null) {
            existing.setMoTa(dto.getMoTa());
        }

        return toDto(repo.save(existing));
    }

    // ===== DELETE =====
    public void delete(String ma) {
        PhuongThucThanhToan existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        repo.delete(existing);
    }

    // ===== MAPPER =====

    private PhuongThucThanhToanDTO toDto(PhuongThucThanhToan e) {
        return PhuongThucThanhToanDTO.builder()
                .maPhuongThucThanhToan(e.getMaPhuongThucThanhToan())
                .tenPhuongThucThanhToan(e.getTenPhuongThucThanhToan())
                .moTa(e.getMoTa())
                .build();
    }

    private PhuongThucThanhToan toEntity(PhuongThucThanhToanDTO dto) {
        return PhuongThucThanhToan.builder()
                .maPhuongThucThanhToan(dto.getMaPhuongThucThanhToan())
                .tenPhuongThucThanhToan(dto.getTenPhuongThucThanhToan())
                .moTa(dto.getMoTa())
                .build();
    }
}