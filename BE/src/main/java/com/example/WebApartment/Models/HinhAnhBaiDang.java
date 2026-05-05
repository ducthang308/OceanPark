package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "HinhAnhBaiDang")
@Data
public class HinhAnhBaiDang {

    @Id
    private String maHinhAnhBaiDang;

    @ManyToOne
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    private String loai;
    private String duongDan;
    private String thumbnailUrl;
    private Integer thuTu;
}