package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "CanHo")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CanHo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double gia;
    private Double dienTich;
    private Integer soPhongNgu;
    private Integer soPhongTam;
    private String diaChi;
    private String phuong;
    private String quan;
    private String thanhPho;
    private Boolean coBanCong;
    private Boolean dayDuNoiThat;

    @OneToOne
    @JoinColumn(name = "baiDangId")
    private BaiDang baiDang;
}