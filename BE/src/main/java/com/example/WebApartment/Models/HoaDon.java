package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "HoaDon")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoaDon {

    @Id
    @Column(name = "maHoaDon")
    private String maHoaDon;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    @Column(name = "loaiHoaDon")
    private String loaiHoaDon;

    @Column(name = "soTien")
    private Double soTien;

    @Column(name = "trangThaiThanhToan")
    private String trangThaiThanhToan;

    @Column(name = "trangThaiHieuLuc")
    private String trangThaiHieuLuc;

    @Column(name = "ngayBatDau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngayKetThuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "noiDungChuyenKhoan")
    private String noiDungChuyenKhoan;

    @Column(name = "ghiChu")
    private String ghiChu;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;

    @Column(name = "ngayThanhToan")
    private LocalDateTime ngayThanhToan;

    @ManyToOne
    @JoinColumn(name = "maGoiDangBai")
    private GoiDangBai goiDangBai;
}
