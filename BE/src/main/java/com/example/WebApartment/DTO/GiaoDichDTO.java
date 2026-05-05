package com.example.WebApartment.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GiaoDichDTO {
    private String maGiaoDich;
    private String maNguoiDung;
    private String maThanhToan;
    private String maMucDichThanhToan;

    private Double soTien;
    private String trangThai;
    private LocalDateTime ngayTao;
    private String noiDung;
}
