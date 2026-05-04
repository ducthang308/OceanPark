package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.PhuongThucThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PhuongThucThanhToanRepository extends JpaRepository<PhuongThucThanhToan, String> {

    boolean existsByTenPhuongThucThanhToan(String ten);
}
