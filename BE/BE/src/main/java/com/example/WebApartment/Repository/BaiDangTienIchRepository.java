package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.BaiDangTienIch;
import com.example.WebApartment.Models.BaiDangTienIchId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaiDangTienIchRepository extends JpaRepository<BaiDangTienIch, BaiDangTienIchId> {

    boolean existsByTienIch_MaTienIch(String maTienIch);

    boolean existsByBaiDang_MaBaiDangAndTienIch_MaTienIch(String maBaiDang, String maTienIch);

    List<BaiDangTienIch> findByBaiDang_MaBaiDang(String maBaiDang);

    List<BaiDangTienIch> findByTienIch_MaTienIch(String maTienIch);

    void deleteByBaiDang_MaBaiDangAndTienIch_MaTienIch(String maBaiDang, String maTienIch);
}