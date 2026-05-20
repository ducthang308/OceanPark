package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordRevenueDTO {
    private String maHoaDon;
    private String maBaiDang;
    private String tieuDeBaiDang;
    private String maNguoiThue;
    private String tenNguoiThue;
    private Double soTien;
    private LocalDateTime ngayThanhToan;
    private LocalDateTime ngayTao;
    private String noiDungChuyenKhoan;
    private String ghiChu;
}
