package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hinhanhbaidang")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HinhAnhBaiDang {

    @Id
    @Column(name = "maHinhAnhBaiDang")
    private String maHinhAnhBaiDang;

    @ManyToOne
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    @Column(name = "loai")
    private String loai;

    @Column(name = "duongDan")
    private String duongDan;

    @Column(name = "thumbnailUrl")
    private String thumbnailUrl;

    @Column(name = "thuTu")
    private Integer thuTu;
}