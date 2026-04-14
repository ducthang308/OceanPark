package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;


@Entity
@Table(name = "NguoiDung")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String hoTen;
    private String email;
    private String diaChi;
    private String soDienThoai;
    private Boolean trangThai;
    private String matKhau;
    private String taiKhoanFacebook;
    private String taiKhoanGoogle;
    private String anhDaiDien;

    @ManyToOne
    @JoinColumn(name = "vaiTroId")
    private VaiTro vaiTro;

    @OneToMany(mappedBy = "nguoiDung")
    private List<BaiDang> baiDangs;
}
