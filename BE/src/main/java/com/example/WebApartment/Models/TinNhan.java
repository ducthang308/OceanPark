package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "TinNhan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TinNhan {

    @Id
    private String maTinNhan;

    @ManyToOne
    @JoinColumn(name = "maPhongChat")
    private PhongChat phongChat;

    @ManyToOne
    @JoinColumn(name = "maNguoiGui")
    private NguoiDung nguoiGui;

    @Column(columnDefinition = "TEXT")
    private String noiDung;

    private String loaiTinNhan;

    private String tepDinhKemUrl;

    private String trangThai;

    private LocalDateTime thoiGianGui;
}