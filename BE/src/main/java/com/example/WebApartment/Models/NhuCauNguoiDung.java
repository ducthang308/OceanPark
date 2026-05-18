package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "NhuCauNguoiDung")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NhuCauNguoiDung {
    @Id
    private String maNhuCauNguoiDung;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    private Double minPrice;
    private Double maxPrice;
    private String phuong;
    private String loaiCanHo;
    private Boolean coBanCong;
    private Boolean dayDuNoiThat;
    private Boolean coMayLanh;
    private Boolean coThangMay;
    private Boolean coMayGiat;
    private Boolean coNhaXe;
    private Boolean coTuLanh;
    private Boolean gioGiacTuDo;
    private Boolean ganTrungTam;
    private Boolean ganBien;
    private java.time.LocalDateTime ngayTao;
}
