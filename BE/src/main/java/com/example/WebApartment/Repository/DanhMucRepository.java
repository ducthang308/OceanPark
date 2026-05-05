package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface DanhMucRepository extends JpaRepository<DanhMuc, String> {
    boolean existsByTenDanhMuc(String tenDanhMuc);
}
