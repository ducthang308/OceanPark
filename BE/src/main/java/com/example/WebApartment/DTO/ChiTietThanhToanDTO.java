package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Data
public class ChiTietThanhToanDTO {
    private String maChiTietThanhToan;
    private String maNguoiDung;
    private String maThanhToan;

    private Date ngayBatDau;
    private Date ngayKetThuc;
    private Double soTien;
    private String trangThai;
    private LocalDateTime ngayTao;
}
