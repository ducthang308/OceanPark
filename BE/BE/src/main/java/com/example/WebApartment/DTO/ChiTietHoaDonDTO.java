package com.example.WebApartment.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChiTietHoaDonDTO {
    private String maChiTietHoaDon;
    private String maHoaDon;
    private String maBaiDang;

    private String noiDung;
    private Double soTien;
    private LocalDateTime ngayTao;
}