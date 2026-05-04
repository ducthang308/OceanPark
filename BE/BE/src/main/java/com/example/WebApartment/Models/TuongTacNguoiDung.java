package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "TuongTacNguoiDung")
@Data
public class TuongTacNguoiDung {

    @Id
    private String maTuongTacNguoiDung;

    @ManyToOne
    private NguoiDung nguoiDung;

    @ManyToOne
    private BaiDang baiDang;

    private String loaiHanhDong;
    private java.time.LocalDateTime ngayTao;
}