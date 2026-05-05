package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.MucDichThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MucDichThanhToanRepository extends JpaRepository<MucDichThanhToan, String> {

    boolean existsByTenMucDich(String tenMucDich);
}