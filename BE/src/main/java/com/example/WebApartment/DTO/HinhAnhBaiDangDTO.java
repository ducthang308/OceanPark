package com.example.WebApartment.DTO;

import lombok.*;

@Data
public class HinhAnhBaiDangDTO {
    private String maHinhAnhBaiDang;
    private String maBaiDang;

    private String loai;
    private String duongDan;
    private String thumbnailUrl;
    private Integer thuTu;
}
