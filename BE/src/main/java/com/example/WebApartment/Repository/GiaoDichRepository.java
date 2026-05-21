package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.GiaoDich;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GiaoDichRepository extends JpaRepository<GiaoDich, String> {
    boolean existsByProviderTransactionNo(String providerTransactionNo);

    @Query("""
            SELECT gd
            FROM GiaoDich gd
            JOIN gd.hoaDon hd
            WHERE UPPER(gd.trangThai) = UPPER(:trangThai)
              AND UPPER(hd.trangThaiThanhToan) = UPPER(:trangThai)
              AND UPPER(hd.loaiHoaDon) = UPPER(:loaiHoaDon)
              AND hd.nguoiDung.vaiTro.maVaiTro = :maVaiTro
            """)
    List<GiaoDich> findValidRevenueTransactions(
            @Param("trangThai") String trangThai,
            @Param("loaiHoaDon") String loaiHoaDon,
            @Param("maVaiTro") String maVaiTro
    );
}
