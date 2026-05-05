package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.ChiTietCanHo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChiTietCanHoRepository extends JpaRepository<ChiTietCanHo, String> {

    Optional<ChiTietCanHo> findByBaiDang_MaBaiDang(String maBaiDang);

    boolean existsByBaiDang_MaBaiDang(String maBaiDang);
}