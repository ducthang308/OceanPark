package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "YeuThich")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class YeuThich {

    @EmbeddedId
    private YeuThichId id;

    @ManyToOne
    @MapsId("nguoiDungId")
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @ManyToOne
    @MapsId("baiDangId")
    @JoinColumn(name = "baiDangId")
    private BaiDang baiDang;
}
