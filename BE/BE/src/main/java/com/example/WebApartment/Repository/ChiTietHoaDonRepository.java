package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.ChiTietHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChiTietHoaDonRepository extends JpaRepository<ChiTietHoaDon, String> {
}
