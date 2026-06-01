package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.GiaoDichVi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GiaoDichViRepository extends JpaRepository<GiaoDichVi, String> {

    List<GiaoDichVi> findByVi_MaViOrderByNgayTaoDesc(String maVi);
}