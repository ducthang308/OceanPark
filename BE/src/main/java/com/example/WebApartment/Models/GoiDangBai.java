package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "GoiDangBai")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoiDangBai {

    @Id
    @Column(name = "maGoiDangBai")
    private String maGoiDangBai;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @Column(name = "tenGoi")
    private String tenGoi;

    @Column(name = "giaTien")
    private Double giaTien;

    @Column(name = "ngayBatDau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngayKetThuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}