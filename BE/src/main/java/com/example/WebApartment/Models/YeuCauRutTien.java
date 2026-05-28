package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "YeuCauRutTien")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YeuCauRutTien {

    @Id
    private String maYeuCauRutTien;

    @ManyToOne
    @JoinColumn(name = "maVi")
    private ViNguoiChoThue vi;

    private String bankCode;
    private String bankAccount;
    private String accountName;

    private Double soTien;

    private String trangThai;

    private LocalDateTime ngayTao;
    private LocalDateTime ngayXuLy;
}