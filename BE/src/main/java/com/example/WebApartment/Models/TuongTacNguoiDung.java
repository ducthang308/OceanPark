package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "TuongTacNguoiDung")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TuongTacNguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String loaiHanhDong;

    @ManyToOne
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "baiDangId")
    private BaiDang baiDang;
}
