package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "NhuCauNguoiDung")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NhuCauNguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double giaMin;
    private Double giaMax;
    private String khuVuc;
    private String loaiCanHo;
    private Boolean coBanCong;
    private Boolean dayDuNoiThat;
    private Boolean ganBien;
    private Boolean ganTrungTam;

    @ManyToOne
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;
}