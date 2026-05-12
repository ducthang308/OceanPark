package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.HoaDonDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.GoiDangBai;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.GoiDangBaiRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HoaDonService {

    private final HoaDonRepository hoaDonRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;
    private final GoiDangBaiRepository goiDangBaiRepository;

    public List<HoaDonDTO> getAll() {
        return hoaDonRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public HoaDonDTO getById(String maHoaDon) {
        HoaDon hoaDon = hoaDonRepository.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        return toDto(hoaDon);
    }

    public List<HoaDonDTO> getByNguoiDung(String maNguoiDung) {
        return hoaDonRepository.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<HoaDonDTO> getByBaiDang(String maBaiDang) {
        return hoaDonRepository.findByBaiDang_MaBaiDang(maBaiDang)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public HoaDonDTO create(HoaDonDTO dto) {
        if (dto == null) throw new RuntimeException("Dữ liệu hóa đơn không hợp lệ");

        NguoiDung nguoiDung = nguoiDungRepository.findById(dto.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        BaiDang baiDang = null;
        if (dto.getMaBaiDang() != null && !dto.getMaBaiDang().isBlank()) {
            baiDang = baiDangRepository.findById(dto.getMaBaiDang())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        }

        GoiDangBai goiDangBai = null;
        if (dto.getMaGoiDangBai() != null && !dto.getMaGoiDangBai().isBlank()) {
            goiDangBai = goiDangBaiRepository.findById(dto.getMaGoiDangBai())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy gói đăng bài"));
        }

        String maHoaDon = dto.getMaHoaDon() != null && !dto.getMaHoaDon().isBlank()
                ? dto.getMaHoaDon()
                : generateMaHoaDon();

        HoaDon hoaDon = HoaDon.builder()
                .maHoaDon(maHoaDon)
                .nguoiDung(nguoiDung)
                .baiDang(baiDang)
                .goiDangBai(goiDangBai)
                .loaiHoaDon(dto.getLoaiHoaDon())
                .soTien(dto.getSoTien())
                .trangThaiThanhToan(dto.getTrangThaiThanhToan() != null ? dto.getTrangThaiThanhToan() : "PENDING")
                .trangThaiHieuLuc(dto.getTrangThaiHieuLuc() != null ? dto.getTrangThaiHieuLuc() : "CHUA_HIEU_LUC")
                .ngayBatDau(dto.getNgayBatDau())
                .ngayKetThuc(dto.getNgayKetThuc())
                .noiDungChuyenKhoan(dto.getNoiDungChuyenKhoan() != null ? dto.getNoiDungChuyenKhoan() : maHoaDon)
                .ghiChu(dto.getGhiChu())
                .ngayTao(LocalDateTime.now())
                .ngayThanhToan(dto.getNgayThanhToan())
                .build();

        return toDto(hoaDonRepository.save(hoaDon));
    }

    public HoaDonDTO update(String maHoaDon, HoaDonDTO dto) {
        HoaDon existing = hoaDonRepository.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (dto.getLoaiHoaDon() != null) existing.setLoaiHoaDon(dto.getLoaiHoaDon());
        if (dto.getSoTien() != null) existing.setSoTien(dto.getSoTien());
        if (dto.getTrangThaiThanhToan() != null) existing.setTrangThaiThanhToan(dto.getTrangThaiThanhToan());
        if (dto.getTrangThaiHieuLuc() != null) existing.setTrangThaiHieuLuc(dto.getTrangThaiHieuLuc());
        if (dto.getNgayBatDau() != null) existing.setNgayBatDau(dto.getNgayBatDau());
        if (dto.getNgayKetThuc() != null) existing.setNgayKetThuc(dto.getNgayKetThuc());
        if (dto.getNoiDungChuyenKhoan() != null) existing.setNoiDungChuyenKhoan(dto.getNoiDungChuyenKhoan());
        if (dto.getGhiChu() != null) existing.setGhiChu(dto.getGhiChu());
        if (dto.getNgayThanhToan() != null) existing.setNgayThanhToan(dto.getNgayThanhToan());

        return toDto(hoaDonRepository.save(existing));
    }

    public void delete(String maHoaDon) {
        HoaDon existing = hoaDonRepository.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        hoaDonRepository.delete(existing);
    }

    private String generateMaHoaDon() {
        return "HD" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private HoaDonDTO toDto(HoaDon entity) {
        if (entity == null) return null;

        return HoaDonDTO.builder()
                .maHoaDon(entity.getMaHoaDon())
                .maNguoiDung(entity.getNguoiDung() != null ? entity.getNguoiDung().getMaNguoiDung() : null)
                .maBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getMaBaiDang() : null)
                .maGoiDangBai(entity.getGoiDangBai() != null ? entity.getGoiDangBai().getMaGoiDangBai() : null)
                .loaiHoaDon(entity.getLoaiHoaDon())
                .soTien(entity.getSoTien())
                .trangThaiThanhToan(entity.getTrangThaiThanhToan())
                .trangThaiHieuLuc(entity.getTrangThaiHieuLuc())
                .ngayBatDau(entity.getNgayBatDau())
                .ngayKetThuc(entity.getNgayKetThuc())
                .noiDungChuyenKhoan(entity.getNoiDungChuyenKhoan())
                .ghiChu(entity.getGhiChu())
                .ngayTao(entity.getNgayTao())
                .ngayThanhToan(entity.getNgayThanhToan())
                .build();
    }
}