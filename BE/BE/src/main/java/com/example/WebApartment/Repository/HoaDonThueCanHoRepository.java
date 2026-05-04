package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.HoaDonThueCanHo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoaDonThueCanHoRepository extends JpaRepository<HoaDonThueCanHo, String> {
}