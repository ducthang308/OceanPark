package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "BaiDangYeuThich")
@Data
public class BaiDangYeuThich {

    @EmbeddedId
    private BaiDangYeuThichId id;

    @ManyToOne
    @MapsId("maNguoiDung")
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @MapsId("maBaiDang")
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    private java.time.LocalDateTime ngayTao;
}