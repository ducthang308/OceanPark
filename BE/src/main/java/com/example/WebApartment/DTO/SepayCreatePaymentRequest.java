package com.example.WebApartment.DTO;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SepayCreatePaymentRequest {
    private String maNguoiDung;
    private String maBaiDang;
    private String loaiHoaDon;
    private Double soTien;
    private Integer thoiHanThang;
    private String ghiChu;
    private List<ChiTietHoaDonDTO> chiTietHoaDon;
}
