package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.ViNguoiChoThue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ViNguoiChoThueRepository extends JpaRepository<ViNguoiChoThue, String> {

    Optional<ViNguoiChoThue> findByNguoiDung_MaNguoiDung(String maNguoiDung);
}