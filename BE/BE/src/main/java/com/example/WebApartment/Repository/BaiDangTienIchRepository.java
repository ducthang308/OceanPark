package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.BaiDangTienIch;
import com.example.WebApartment.Models.BaiDangTienIchId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface BaiDangTienIchRepository extends JpaRepository<BaiDangTienIch, BaiDangTienIchId> {
    boolean existsByTienIch_MaTienIch(String maTienIch);
}
