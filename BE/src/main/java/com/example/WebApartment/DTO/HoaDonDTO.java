package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoaDonDTO {

    private String maHoaDon;
    private String maNguoiDung;
    private String maBaiDang;
    private String maGoiDangBai;

    private String loaiHoaDon;

    private Double soTien;

    private String trangThaiThanhToan;
    private String trangThaiHieuLuc;

    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;

    private String noiDungChuyenKhoan;
    private String ghiChu;

    private LocalDateTime ngayTao;
    private LocalDateTime ngayThanhToan;
}