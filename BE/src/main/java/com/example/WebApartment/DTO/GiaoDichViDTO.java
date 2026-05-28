package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiaoDichViDTO {
    private String maGiaoDichVi;
    private String maVi;
    private String maHoaDon;
    private String loaiGiaoDich;
    private Double soTien;
    private String noiDung;
    private LocalDateTime ngayTao;
}