package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ChiTietCanHo")
@Data
public class ChiTietCanHo {

    @Id
    private String maChiTietCanHo;

    @OneToOne
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    private Double gia;
    private Float dienTich;
    private Integer phongNgu;
    private String diaChiCuThe;
    private String huongCanHo;
    private String phuong;
    private Double lat;
    private Double lng;

    private java.time.LocalDateTime ngayTao;
}