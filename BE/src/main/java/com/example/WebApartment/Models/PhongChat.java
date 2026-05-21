package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "PhongChat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhongChat {

    @Id
    private String maPhongChat;

    private String loaiPhongChat;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung1")
    private NguoiDung nguoiDung1;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung2")
    private NguoiDung nguoiDung2;

    @ManyToOne
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    @Column(columnDefinition = "TEXT")
    private String tinNhanCuoi;

    private LocalDateTime thoiGianTinNhanCuoi;

    private LocalDateTime ngayTao;
}