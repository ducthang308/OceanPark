package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ChiTietCanHo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiTietCanHo {

    @Id
    @Column(name = "maChiTietCanHo")
    private String maChiTietCanHo;

    @OneToOne
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    @Column(name = "gia")
    private Double gia;

    @Column(name = "dienTich")
    private Float dienTich;

    @Column(name = "phongNgu")
    private Integer phongNgu;

    @Column(name = "diaChiCuThe")
    private String diaChiCuThe;

    @Column(name = "huongCanHo")
    private String huongCanHo;

    @Column(name = "phuong")
    private String phuong;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}