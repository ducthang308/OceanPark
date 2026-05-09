package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "GiaoDich")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiaoDich {

    @Id
    @Column(name = "maGiaoDich")
    private String maGiaoDich;

    @ManyToOne
    @JoinColumn(name = "maHoaDon")
    private HoaDon hoaDon;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "maPhuongThucThanhToan")
    private PhuongThucThanhToan phuongThucThanhToan;

    @Column(name = "soTien")
    private Double soTien;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "provider")
    private String provider;

    @Column(name = "providerTxnRef")
    private String providerTxnRef;

    @Column(name = "providerTransactionNo")
    private String providerTransactionNo;

    @Column(name = "providerResponseCode")
    private String providerResponseCode;

    @Column(name = "providerTransactionStatus")
    private String providerTransactionStatus;

    @Column(name = "bankCode")
    private String bankCode;

    @Column(name = "bankAccount")
    private String bankAccount;

    @Column(name = "payDate")
    private String payDate;

    @Column(name = "orderInfo")
    private String orderInfo;

    @Column(name = "rawData", columnDefinition = "TEXT")
    private String rawData;

    @Column(name = "noiDung")
    private String noiDung;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}