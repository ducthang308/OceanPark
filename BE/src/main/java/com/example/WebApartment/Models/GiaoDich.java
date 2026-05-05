package com.example.WebApartment.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import jakarta.persistence.*;

@Entity
@Table(name = "GiaoDich")
@Data
public class GiaoDich {

    @Id
    private String maGiaoDich;

    @ManyToOne
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "maThanhToan")
    private PhuongThucThanhToan phuongThuc;

    @ManyToOne
    private MucDichThanhToan mucDich;

    private Double soTien;
    private String trangThai;
    private java.time.LocalDateTime ngayTao;
    private String noiDung;
}