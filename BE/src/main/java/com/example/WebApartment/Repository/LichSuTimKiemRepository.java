package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.LichSuTimKiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichSuTimKiemRepository extends JpaRepository<LichSuTimKiem, String> {

    List<LichSuTimKiem> findByNguoiDung_MaNguoiDung(String maNguoiDung);
}
