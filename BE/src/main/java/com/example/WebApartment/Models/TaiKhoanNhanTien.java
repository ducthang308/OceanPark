package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "TaiKhoanNhanTien")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiKhoanNhanTien {

    @Id
    @Column(name = "maTaiKhoan")
    private String maTaiKhoan;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @Column(name = "bankCode")
    private String bankCode;

    @Column(name = "bankAccount")
    private String bankAccount;

    @Column(name = "accountName")
    private String accountName;

    @Column(name = "isDefault")
    private Boolean isDefault;

    @Column(name = "trangThai")
    private String trangThai;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;
}
