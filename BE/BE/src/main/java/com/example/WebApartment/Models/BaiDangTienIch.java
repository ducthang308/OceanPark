package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BaiDang_TienIch")
@Data
public class BaiDangTienIch {

    @EmbeddedId
    private BaiDangTienIchId id;

    @ManyToOne
    @MapsId("maBaiDang")
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    @ManyToOne
    @MapsId("maTienIch")
    @JoinColumn(name = "maTienIch")
    private TienIch tienIch;
}