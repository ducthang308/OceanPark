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

    private final LichSuTimKiemRepository lichSuTimKiemRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public List<LichSuTimKiemDTO> getAll() {
        return lichSuTimKiemRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public LichSuTimKiemDTO getById(String maLichSuTimKiem) {
        LichSuTimKiem entity = lichSuTimKiemRepository.findById(maLichSuTimKiem)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch sử tìm kiếm"));

        return toDto(entity);
    }

    public List<LichSuTimKiemDTO> getByNguoiDung(String maNguoiDung) {
        return lichSuTimKiemRepository.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public LichSuTimKiemDTO create(LichSuTimKiemDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu lịch sử tìm kiếm không hợp lệ");
        }

        if (dto.getMaNguoiDung() == null || dto.getMaNguoiDung().isBlank()) {
            throw new RuntimeException("Mã người dùng không được để trống");
        }

        NguoiDung nguoiDung = nguoiDungRepository.findById(dto.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        LichSuTimKiem entity = LichSuTimKiem.builder()
                .maLichSuTimKiem(generateId())
                .nguoiDung(nguoiDung)
                .tuKhoa(dto.getTuKhoa())
                .minPrice(dto.getMinPrice())
                .maxPrice(dto.getMaxPrice())
                .phuong(dto.getPhuong())
                .thoiGian(LocalDateTime.now())
                .build();

        return toDto(lichSuTimKiemRepository.save(entity));
    }

    public void delete(String maLichSuTimKiem) {
        LichSuTimKiem existing = lichSuTimKiemRepository.findById(maLichSuTimKiem)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch sử tìm kiếm"));

        lichSuTimKiemRepository.delete(existing);
    }

    private String generateId() {
        return "LSTK" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }

    private LichSuTimKiemDTO toDto(LichSuTimKiem entity) {
        if (entity == null) return null;

        return LichSuTimKiemDTO.builder()
                .maLichSuTimKiem(entity.getMaLichSuTimKiem())
                .maNguoiDung(entity.getNguoiDung() != null ? entity.getNguoiDung().getMaNguoiDung() : null)
                .tuKhoa(entity.getTuKhoa())
                .minPrice(entity.getMinPrice())
                .maxPrice(entity.getMaxPrice())
                .phuong(entity.getPhuong())
                .thoiGian(entity.getThoiGian())
                .build();
    }
}