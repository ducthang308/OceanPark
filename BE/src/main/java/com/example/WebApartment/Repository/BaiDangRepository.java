package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.BaiDang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BaiDangRepository extends JpaRepository<BaiDang, String> {
    boolean existsByDanhMuc_MaDanhMuc(String maDanhMuc);
    Optional<BaiDang> findTopByOrderByMaBaiDangDesc();
}