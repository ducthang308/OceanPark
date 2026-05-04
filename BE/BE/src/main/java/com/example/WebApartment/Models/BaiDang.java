package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "BaiDang")
@Data
@Getter
@Setter
public class BaiDang {

    @Id
    private String maBaiDang;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "maDanhMuc")
    private DanhMuc danhMuc;

    private String tieuDe;

    @Column(columnDefinition = "TEXT")
    private String noiDung;

    private java.sql.Date ngayDang;
    private String trangThai;
    private String lienHe;
    private String phuongThucThanhToan;
}