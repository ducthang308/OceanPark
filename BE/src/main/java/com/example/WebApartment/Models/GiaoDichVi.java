package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "GiaoDichVi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiaoDichVi {

    @Id
    private String maGiaoDichVi;

    @ManyToOne
    @JoinColumn(name = "maVi")
    private ViNguoiChoThue vi;

    @ManyToOne
    @JoinColumn(name = "maHoaDon")
    private HoaDon hoaDon;

    private String loaiGiaoDich;

    private Double soTien;

    @Column(columnDefinition = "TEXT")
    private String noiDung;

    private LocalDateTime ngayTao;
}