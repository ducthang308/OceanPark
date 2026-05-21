package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentPriceAnalysisResponse {
    private String mucDoHopLy;
    private Double giaThap;
    private Double giaCao;
    private Double giaKhuyenNghi;
    private String nhanXet;
    private String chienLuoc;
}