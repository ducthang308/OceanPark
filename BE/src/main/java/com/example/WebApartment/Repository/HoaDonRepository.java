package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, String> {

    List<HoaDon> findByNguoiDung_MaNguoiDung(String maNguoiDung);

    List<HoaDon> findByBaiDang_MaBaiDang(String maBaiDang);

    List<HoaDon> findByLoaiHoaDon(String loaiHoaDon);

    List<HoaDon> findByTrangThaiThanhToan(String trangThaiThanhToan);

    Optional<HoaDon> findByNoiDungChuyenKhoan(String noiDungChuyenKhoan);

    List<HoaDon> findByLoaiHoaDonAndTrangThaiThanhToan(
            String loaiHoaDon,
            String trangThaiThanhToan
    );

    List<HoaDon> findByBaiDang_NguoiDung_MaNguoiDungAndLoaiHoaDonAndTrangThaiThanhToan(
            String maNguoiDung,
            String loaiHoaDon,
            String trangThaiThanhToan
    );

    List<HoaDon> findByBaiDang_MaBaiDangAndLoaiHoaDonAndTrangThaiThanhToan(
            String maBaiDang,
            String loaiHoaDon,
            String trangThaiThanhToan
    );

    long countByTrangThaiThanhToanIgnoreCase(String trangThaiThanhToan);
}
