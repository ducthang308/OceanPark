package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.GoiDangBai;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface GoiDangBaiRepository extends JpaRepository<GoiDangBai, String> {

    Optional<GoiDangBai>
    findFirstByNguoiDung_MaNguoiDungAndTrangThaiAndNgayKetThucAfter(
            String maNguoiDung,
            String trangThai,
            LocalDateTime now
    );
}