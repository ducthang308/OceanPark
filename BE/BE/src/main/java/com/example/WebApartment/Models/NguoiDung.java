package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "NguoiDung")
@Data
@Builder
public class NguoiDung {

    @Id
    private String maNguoiDung;

    @ManyToOne
    @JoinColumn(name = "maVaiTro")
    private VaiTro vaiTro;

    private String hoVaTen;
    private String email;
    private String diaChi;
    private String soDienThoai;
    private Boolean trangThai;
    private String matKhau;
    private String facebookAccount;
    private String googleAccount;
    private String anhDaiDien;
}