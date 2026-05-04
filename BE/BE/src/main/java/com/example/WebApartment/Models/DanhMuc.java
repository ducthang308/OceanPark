package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "DanhMuc")
@Data
@Builder
public class DanhMuc {
    @Id
    private String maDanhMuc;

    private String tenDanhMuc;

    @OneToMany(mappedBy = "danhMuc")
    private List<BaiDang> baiDangs;
}