package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.ChiTietHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietHoaDonRepository extends JpaRepository<ChiTietHoaDon, String> {

    List<ChiTietHoaDon> findByHoaDon_MaHoaDon(String maHoaDon);

    List<ChiTietHoaDon> findByBaiDang_MaBaiDang(String maBaiDang);
}
