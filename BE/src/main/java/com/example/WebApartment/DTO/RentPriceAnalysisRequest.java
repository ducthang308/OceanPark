package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentPriceAnalysisRequest {
    private String loaiCanHo;
    private Double giaDeXuat;
    private Double dienTich;
    private String phuong;
    private String diaChi;
    private Integer phongNgu;

    private Boolean coBanCong;
    private Boolean dayDuNoiThat;
    private Boolean coMayLanh;
    private Boolean coThangMay;
    private Boolean coMayGiat;
    private Boolean coNhaXe;
    private Boolean coTuLanh;
    private Boolean gioGiacTuDo;
    private Boolean ganTrungTam;
    private Boolean ganBien;
}