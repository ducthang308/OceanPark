package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.BaiDangYeuThich;
import com.example.WebApartment.Models.BaiDangYeuThichId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaiDangYeuThichRepository extends JpaRepository<BaiDangYeuThich, BaiDangYeuThichId> {

    boolean existsByNguoiDung_MaNguoiDungAndBaiDang_MaBaiDang(String maNguoiDung, String maBaiDang);

    List<BaiDangYeuThich> findByNguoiDung_MaNguoiDung(String maNguoiDung);

    List<BaiDangYeuThich> findByBaiDang_MaBaiDang(String maBaiDang);

    void deleteByNguoiDung_MaNguoiDungAndBaiDang_MaBaiDang(String maNguoiDung, String maBaiDang);

    long countByBaiDang_MaBaiDang(String maBaiDang);

    long countByBaiDang_NguoiDung_MaNguoiDung(String maNguoiDung);
}