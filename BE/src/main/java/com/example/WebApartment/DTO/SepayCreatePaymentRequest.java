package com.example.WebApartment.DTO;

import lombok.*;

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
    private String ghiChu;
}