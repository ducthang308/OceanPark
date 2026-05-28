package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViNguoiChoThueDTO {
    private String maVi;
    private String maNguoiDung;
    private String tenNguoiDung;
    private Double soDuKhaDung;
    private Double soDuChoRut;
    private Double tongDoanhThu;
}