package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "baidang")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaiDang {

    @Id
    @Column(name = "maBaiDang")
    private String maBaiDang;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "maDanhMuc")
    private DanhMuc danhMuc;

    @Column(name = "tieuDe")
    private String tieuDe;

    @Column(name = "noiDung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "ngayDang")
    private LocalDateTime ngayDang;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "lienHe")
    private String lienHe;

    @Column(name = "hinhThucThanhToan")
    private String hinhThucThanhToan;

    @Builder.Default
    @Column(name = "luotXem")
    private Long luotXem = 0L;
}
