package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "GoiDangKy")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GoiDangKy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double soTien;
    private String trangThai;

    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;

    @ManyToOne
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "phuongThucId")
    private PhuongThucThanhToan phuongThucThanhToan;
}
