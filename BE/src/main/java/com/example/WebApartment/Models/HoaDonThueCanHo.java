package com.example.WebApartment.Models;

import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import jakarta.persistence.*;

@Entity
@Table(name = "HoaDonThueCanHo")
@Data
public class HoaDonThueCanHo {
    @Id
    private String maHoaDon;

    @ManyToOne
    private NguoiDung nguoiDung;

    @ManyToOne
    private MucDichThanhToan mucDich;

    private java.time.LocalDateTime ngayLapHoaDon;
    private Double tongTien;
    private String trangThai;
    private String ghiChu;
}
