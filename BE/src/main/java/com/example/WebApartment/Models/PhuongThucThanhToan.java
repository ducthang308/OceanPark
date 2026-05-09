package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PhuongThucThanhToan")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhuongThucThanhToan {
    @Id
    private String maPhuongThucThanhToan;

    private String tenPhuongThucThanhToan;
    private String moTa;

    @Column(name = "provider")
    private String provider;
}