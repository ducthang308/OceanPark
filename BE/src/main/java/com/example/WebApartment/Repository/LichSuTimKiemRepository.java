package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.LichSuTimKiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichSuTimKiemRepository
        extends JpaRepository<LichSuTimKiem, String> {

    // ===== Lấy toàn bộ lịch sử theo user =====
    List<LichSuTimKiem>
    findByNguoiDung_MaNguoiDung(String maNguoiDung);

    // ===== 5 lịch sử gần nhất =====
    List<LichSuTimKiem>
    findTop5ByNguoiDung_MaNguoiDungOrderByThoiGianDesc(
            String maNguoiDung
    );

    // ===== Tìm kiếm nhiều nhất theo phường =====
    List<LichSuTimKiem>
    findByPhuongContainingIgnoreCase(String phuong);

    // ===== Tìm theo keyword =====
    List<LichSuTimKiem>
    findByTuKhoaContainingIgnoreCase(String tuKhoa);
}