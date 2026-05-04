package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
public class ChiTietCanHoDTO {
    private String maChiTietCanHo;
    private String maBaiDang;

    private Double gia;
    private Float dienTich;
    private Integer phongNgu;
    private String diaChiCuThe;
    private String huongCanHo;
    private String phuong;
    private Double lat;
    private Double lng;

    private LocalDateTime ngayTao;
}
