package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "PhuongThucThanhToan")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PhuongThucThanhToan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tenPhuongThuc;
    private String moTa;
}
