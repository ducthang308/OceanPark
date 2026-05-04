package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.BaiDangYeuThich;
import com.example.WebApartment.Models.BaiDangYeuThichId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface BaiDangYeuThichRepository extends JpaRepository<BaiDangYeuThich, BaiDangYeuThichId> {
}
