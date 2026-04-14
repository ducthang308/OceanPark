package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "HinhAnhBaiDang")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HinhAnhBaiDang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String loai;
    private String duongDan;
    private String thumbnail;
    private Integer thuTu;

    @ManyToOne
    @JoinColumn(name = "baiDangId")
    private BaiDang baiDang;
}
