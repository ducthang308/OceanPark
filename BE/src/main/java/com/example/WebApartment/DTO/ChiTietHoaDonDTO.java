package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiTietHoaDonDTO {

    private String maChiTietHoaDon;
    private String maHoaDon;
    private String maBaiDang;
    private Integer soLuong;
    private Double donGia;
    private Double thanhTien;
    private String ghiChu;

    private String tieuDeBaiDang;
    private String diaChiCanHo;
    private String phuong;
}
