package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ViNguoiChoThue")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViNguoiChoThue {

    @Id
    private String maVi;

    @OneToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    private Double soDuKhaDung;
    private Double soDuChoRut;
    private Double tongDoanhThu;

    private LocalDateTime ngayTao;
}