package com.example.WebApartment.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HoaDonThueCanHoDTO {
    private String maHoaDon;
    private String maNguoiDung;
    private String maMucDichThanhToan;

    private LocalDateTime ngayLapHoaDon;
    private Double tongTien;
    private String trangThai;
    private String ghiChu;
}
