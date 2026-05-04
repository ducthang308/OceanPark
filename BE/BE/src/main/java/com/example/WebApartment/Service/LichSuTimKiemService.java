package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.LichSuTimKiemDTO;
import com.example.WebApartment.Models.LichSuTimKiem;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Repository.LichSuTimKiemRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LichSuTimKiemService {

    private final LichSuTimKiemRepository lichSuRepo;
    private final NguoiDungRepository nguoiDungRepo;

    // ================= GET ALL =================
    public List<LichSuTimKiemDTO> getAll() {
        return lichSuRepo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ================= GET BY ID =================
    public LichSuTimKiemDTO getById(String ma) {
        LichSuTimKiem entity = lichSuRepo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch sử"));

        return toDto(entity);
    }

    // ================= CREATE =================
    public LichSuTimKiemDTO create(LichSuTimKiemDTO dto) {

        NguoiDung nguoiDung = nguoiDungRepo.findById(dto.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        LichSuTimKiem entity = toEntity(dto, nguoiDung);

        if (entity.getMaLichSuTimKiem() == null) {
            entity.setMaLichSuTimKiem(UUID.randomUUID().toString());
        }

        if (entity.getThoiGian() == null) {
            entity.setThoiGian(LocalDateTime.now());
        }

        return toDto(lichSuRepo.save(entity));
    }

    // ================= UPDATE =================
    public LichSuTimKiemDTO update(String ma, LichSuTimKiemDTO dto) {

        LichSuTimKiem existing = lichSuRepo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch sử"));

        if (dto.getMaNguoiDung() != null) {
            NguoiDung nguoiDung = nguoiDungRepo.findById(dto.getMaNguoiDung())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
            existing.setNguoiDung(nguoiDung);
        }

        if (dto.getTuKhoa() != null) existing.setTuKhoa(dto.getTuKhoa());
        if (dto.getMinPrice() != null) existing.setMinPrice(dto.getMinPrice());
        if (dto.getMaxPrice() != null) existing.setMaxPrice(dto.getMaxPrice());
        if (dto.getPhuong() != null) existing.setPhuong(dto.getPhuong());

        return toDto(lichSuRepo.save(existing));
    }

    // ================= DELETE =================
    public void delete(String ma) {
        LichSuTimKiem existing = lichSuRepo.findById(ma)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch sử"));

        lichSuRepo.delete(existing);
    }

    // ================= MAPPER =================

    private LichSuTimKiemDTO toDto(LichSuTimKiem e) {
        return LichSuTimKiemDTO.builder()
                .maLichSuTimKiem(e.getMaLichSuTimKiem())
                .maNguoiDung(e.getNguoiDung() != null ? e.getNguoiDung().getMaNguoiDung() : null)
                .tuKhoa(e.getTuKhoa())
                .minPrice(e.getMinPrice())
                .maxPrice(e.getMaxPrice())
                .phuong(e.getPhuong())
                .thoiGian(e.getThoiGian())
                .build();
    }

    private LichSuTimKiem toEntity(LichSuTimKiemDTO dto, NguoiDung nguoiDung) {
        return LichSuTimKiem.builder()
                .maLichSuTimKiem(dto.getMaLichSuTimKiem())
                .nguoiDung(nguoiDung)
                .tuKhoa(dto.getTuKhoa())
                .minPrice(dto.getMinPrice())
                .maxPrice(dto.getMaxPrice())
                .phuong(dto.getPhuong())
                .thoiGian(dto.getThoiGian())
                .build();
    }
}