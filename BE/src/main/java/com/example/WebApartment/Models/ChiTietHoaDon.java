package com.example.WebApartment.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import jakarta.persistence.Id;

@Entity
@Table(name = "ChiTietHoaDon")
@Data
public class ChiTietHoaDon {
    @Id
    private String maChiTietHoaDon;

    @ManyToOne
    private HoaDonThueCanHo hoaDon;

    @ManyToOne
    private BaiDang baiDang;

    private String noiDung;
    private Double soTien;
    private java.time.LocalDateTime ngayTao;
}