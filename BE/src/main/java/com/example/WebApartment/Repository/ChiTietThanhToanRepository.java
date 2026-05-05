package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.ChiTietThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface ChiTietThanhToanRepository extends JpaRepository<ChiTietThanhToan, String> {
}
