package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "BaiDang")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BaiDang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tieuDe;

    @Column(columnDefinition = "TEXT")
    private String noiDung;

    private String trangThai;
    private String lienHe;
    private String hinhThucThanhToan;

    @ManyToOne
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "danhMucId")
    private DanhMuc danhMuc;

    @OneToOne(mappedBy = "baiDang")
    private CanHo canHo;

    @ManyToMany
    @JoinTable(
            name = "BaiDang_TienIch",
            joinColumns = @JoinColumn(name = "baiDangId"),
            inverseJoinColumns = @JoinColumn(name = "tienIchId")
    )
    private List<TienIch> tienIchs;

    @ManyToMany
    @JoinTable(
            name = "BaiDang_The",
            joinColumns = @JoinColumn(name = "baiDangId"),
            inverseJoinColumns = @JoinColumn(name = "theId")
    )
    private List<The> thes;
}
