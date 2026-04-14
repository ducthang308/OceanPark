package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "LichSuGiaoDich")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LichSuGiaoDich {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double soTien;
    private String trangThai;

    @ManyToOne
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "phuongThucId")
    private PhuongThucThanhToan phuongThucThanhToan;
}
