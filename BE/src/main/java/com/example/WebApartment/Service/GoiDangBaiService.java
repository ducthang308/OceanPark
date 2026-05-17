package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.GoiDangBaiDTO;
import com.example.WebApartment.Models.GoiDangBai;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Repository.GoiDangBaiRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoiDangBaiService {

    private final GoiDangBaiRepository goiDangBaiRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public List<GoiDangBaiDTO> getAll() {
        return goiDangBaiRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public GoiDangBaiDTO getById(String maGoiDangBai) {
        GoiDangBai entity = goiDangBaiRepository.findById(maGoiDangBai)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói đăng bài"));

        return toDto(entity);
    }

    public GoiDangBaiDTO create(GoiDangBaiDTO dto) {
        validate(dto);

        LocalDateTime ngayBatDau = dto.getNgayBatDau();
        if (ngayBatDau == null && dto.getThoiHanNgay() != null && dto.getThoiHanNgay() > 0) {
            ngayBatDau = LocalDateTime.now();
        }
        LocalDateTime ngayKetThuc = resolveNgayKetThuc(ngayBatDau, dto.getNgayKetThuc(), dto.getThoiHanNgay());

        GoiDangBai entity = GoiDangBai.builder()
                .maGoiDangBai(
                        dto.getMaGoiDangBai() != null && !dto.getMaGoiDangBai().isBlank()
                                ? dto.getMaGoiDangBai()
                                : generateMaGoiDangBai()
                )
                .nguoiDung(resolveNguoiDung(dto.getMaNguoiDung()))
                .tenGoi(dto.getTenGoi())
                .giaTien(dto.getGiaTien().doubleValue())
                .ngayBatDau(ngayBatDau)
                .ngayKetThuc(ngayKetThuc)
                .trangThai(dto.getTrangThai() != null ? dto.getTrangThai() : "ACTIVE")
                .ngayTao(dto.getNgayTao() != null ? dto.getNgayTao() : LocalDateTime.now())
                .build();

        return toDto(goiDangBaiRepository.save(entity));
    }

    public GoiDangBaiDTO update(String maGoiDangBai, GoiDangBaiDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu cập nhật không hợp lệ");
        }

        GoiDangBai existing = goiDangBaiRepository.findById(maGoiDangBai)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói đăng bài"));

        if (dto.getMaNguoiDung() != null) existing.setNguoiDung(resolveNguoiDung(dto.getMaNguoiDung()));
        if (dto.getTenGoi() != null) existing.setTenGoi(dto.getTenGoi());
        if (dto.getGiaTien() != null) existing.setGiaTien(dto.getGiaTien().doubleValue());
        if (dto.getNgayBatDau() != null) existing.setNgayBatDau(dto.getNgayBatDau());
        if (dto.getNgayKetThuc() != null) existing.setNgayKetThuc(dto.getNgayKetThuc());
        if (dto.getThoiHanNgay() != null) {
            LocalDateTime start = existing.getNgayBatDau() != null ? existing.getNgayBatDau() : LocalDateTime.now();
            existing.setNgayBatDau(start);
            existing.setNgayKetThuc(start.plusDays(dto.getThoiHanNgay()));
        }
        if (dto.getTrangThai() != null) existing.setTrangThai(dto.getTrangThai());

        return toDto(goiDangBaiRepository.save(existing));
    }

    public void delete(String maGoiDangBai) {
        GoiDangBai existing = goiDangBaiRepository.findById(maGoiDangBai)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói đăng bài"));

        goiDangBaiRepository.delete(existing);
    }

    private void validate(GoiDangBaiDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu gói đăng bài không hợp lệ");
        }

        if (dto.getTenGoi() == null || dto.getTenGoi().isBlank()) {
            throw new RuntimeException("Tên gói không được để trống");
        }

        if (dto.getGiaTien() == null || dto.getGiaTien().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Giá tiền không hợp lệ");
        }
    }

    private NguoiDung resolveNguoiDung(String maNguoiDung) {
        if (maNguoiDung == null || maNguoiDung.isBlank()) {
            return null;
        }

        return nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    private LocalDateTime resolveNgayKetThuc(
            LocalDateTime ngayBatDau,
            LocalDateTime ngayKetThuc,
            Integer thoiHanNgay
    ) {
        if (ngayKetThuc != null) {
            return ngayKetThuc;
        }

        if (thoiHanNgay == null || thoiHanNgay <= 0) {
            return null;
        }

        LocalDateTime start = ngayBatDau != null ? ngayBatDau : LocalDateTime.now();
        return start.plusDays(thoiHanNgay);
    }

    private GoiDangBaiDTO toDto(GoiDangBai entity) {
        if (entity == null) return null;

        NguoiDung nguoiDung = entity.getNguoiDung();

        return GoiDangBaiDTO.builder()
                .maGoiDangBai(entity.getMaGoiDangBai())
                .maNguoiDung(nguoiDung != null ? nguoiDung.getMaNguoiDung() : null)
                .hoVaTenNguoiDung(nguoiDung != null ? nguoiDung.getHoVaTen() : null)
                .tenGoi(entity.getTenGoi())
                .giaTien(entity.getGiaTien() != null ? BigDecimal.valueOf(entity.getGiaTien()) : null)
                .thoiHanNgay(resolveThoiHanNgay(entity.getNgayBatDau(), entity.getNgayKetThuc()))
                .trangThai(entity.getTrangThai())
                .ngayBatDau(entity.getNgayBatDau())
                .ngayKetThuc(entity.getNgayKetThuc())
                .ngayTao(entity.getNgayTao())
                .build();
    }

    private Integer resolveThoiHanNgay(LocalDateTime ngayBatDau, LocalDateTime ngayKetThuc) {
        if (ngayBatDau == null || ngayKetThuc == null) {
            return null;
        }

        return Math.toIntExact(ChronoUnit.DAYS.between(ngayBatDau, ngayKetThuc));
    }

    private String generateMaGoiDangBai() {
        return "GDB" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }
}
