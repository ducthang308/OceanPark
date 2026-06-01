package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.YeuCauRutTien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YeuCauRutTienRepository extends JpaRepository<YeuCauRutTien, String> {

    List<YeuCauRutTien> findAllByOrderByNgayTaoDesc();

    List<YeuCauRutTien> findByVi_MaViOrderByNgayTaoDesc(String maVi);

    List<YeuCauRutTien> findByTrangThaiOrderByNgayTaoDesc(String trangThai);
}
