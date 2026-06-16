package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.TaiKhoanNhanTien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaiKhoanNhanTienRepository extends JpaRepository<TaiKhoanNhanTien, String> {

    List<TaiKhoanNhanTien> findByNguoiDung_MaNguoiDung(String maNguoiDung);

    Optional<TaiKhoanNhanTien> findByNguoiDung_MaNguoiDungAndIsDefaultTrueAndTrangThai(
            String maNguoiDung,
            String trangThai
    );

    Optional<TaiKhoanNhanTien> findByNguoiDung_MaNguoiDungAndIsDefaultTrue(String maNguoiDung);
}
