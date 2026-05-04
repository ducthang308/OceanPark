package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
public class NhuCauNguoiDungDTO {
    private String maNhuCauNguoiDung;
    private String maNguoiDung;

    private Double minPrice;
    private Double maxPrice;
    private String phuong;
    private String loaiCanHo;
    private Boolean coBanCong;
    private Boolean dayDuNoiThat;
    private Boolean ganTrungTam;
    private Boolean ganBien;

    private LocalDateTime ngayTao;
}