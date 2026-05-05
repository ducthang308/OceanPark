package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BaiDang_TienIch")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaiDangTienIch {

    @EmbeddedId
    private BaiDangTienIchId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maBaiDang")
    @JoinColumn(name = "maBaiDang")
    private BaiDang baiDang;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maTienIch")
    @JoinColumn(name = "maTienIch")
    private TienIch tienIch;
}