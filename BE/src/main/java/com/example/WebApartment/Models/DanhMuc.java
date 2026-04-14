package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "DanhMuc")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DanhMuc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenDanhMuc")
    private String tenDanhMuc;

    @OneToMany(mappedBy = "danhMuc")
    private List<BaiDang> baiDangs;
}
