package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ChiTietThanhToan")
@Data
public class ChiTietThanhToan {
    @Id
    private String maChiTietThanhToan;

    @ManyToOne
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "maThanhToan")
    private PhuongThucThanhToan phuongThuc;

    private java.sql.Date ngayBatDau;
    private java.sql.Date ngayKetThuc;
    private Double soTien;
    private String trangThai;
    private java.time.LocalDateTime ngayTao;
}