package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.HinhAnhBaiDang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HinhAnhBaiDangRepository extends JpaRepository<HinhAnhBaiDang, String> {

    List<HinhAnhBaiDang> findByBaiDang_MaBaiDangOrderByThuTuAsc(String maBaiDang);

    boolean existsByBaiDang_MaBaiDang(String maBaiDang);

    HinhAnhBaiDang findTopByBaiDang_MaBaiDangOrderByThuTuDesc(String maBaiDang);
}