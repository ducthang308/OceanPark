package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.PhuongThucThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhuongThucThanhToanRepository extends JpaRepository<PhuongThucThanhToan, String> {
    Optional<PhuongThucThanhToan> findByProvider(String provider);
    boolean existsByTenPhuongThucThanhToan(String ten);
}
