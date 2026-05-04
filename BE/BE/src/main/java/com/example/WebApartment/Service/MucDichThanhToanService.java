package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.MucDichThanhToanDTO;
import com.example.WebApartment.Models.MucDichThanhToan;
import com.example.WebApartment.Repository.MucDichThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MucDichThanhToanService {

    private final MucDichThanhToanRepository repo;

    // ================= GET ALL =================
    public List<MucDichThanhToanDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ================= GET BY ID =================
    public MucDichThanhToanDTO getById(String ma) {
        MucDichThanhToan entity = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục đích thanh toán"));

        return toDto(entity);
    }

    // ================= CREATE =================
    public MucDichThanhToanDTO create(MucDichThanhToanDTO dto) {

        if (repo.existsByTenMucDich(dto.getTenMucDich())) {
            throw new RuntimeException("Mục đích thanh toán đã tồn tại");
        }

        MucDichThanhToan entity = toEntity(dto);

        if (entity.getMaMucDichThanhToan() == null) {
            entity.setMaMucDichThanhToan(UUID.randomUUID().toString());
        }

        return toDto(repo.save(entity));
    }

    // ================= UPDATE =================
    public MucDichThanhToanDTO update(String ma, MucDichThanhToanDTO dto) {

        MucDichThanhToan existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        if (dto.getTenMucDich() != null) {
            existing.setTenMucDich(dto.getTenMucDich());
        }

        return toDto(repo.save(existing));
    }

    // ================= DELETE =================
    public void delete(String ma) {
        MucDichThanhToan existing = repo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy"));

        repo.delete(existing);
    }

    // ================= MAPPER =================

    private MucDichThanhToanDTO toDto(MucDichThanhToan e) {
        return MucDichThanhToanDTO.builder()
                .maMucDichThanhToan(e.getMaMucDichThanhToan())
                .tenMucDich(e.getTenMucDich())
                .build();
    }

    private MucDichThanhToan toEntity(MucDichThanhToanDTO dto) {
        return MucDichThanhToan.builder()
                .maMucDichThanhToan(dto.getMaMucDichThanhToan())
                .tenMucDich(dto.getTenMucDich())
                .build();
    }
}