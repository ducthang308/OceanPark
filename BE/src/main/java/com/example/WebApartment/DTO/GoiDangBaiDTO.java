package com.example.WebApartment.DTO;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoiDangBaiDTO {

    private String maGoiDangBai;
    private String maNguoiDung;
    private String hoVaTenNguoiDung;

    private String tenGoi;
    private BigDecimal giaTien;
    private Integer thoiHanNgay;
    private String trangThai;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private LocalDateTime ngayTao;
}
