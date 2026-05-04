package com.example.WebApartment.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
public class BaiDangYeuThichId implements java.io.Serializable {
    private String maNguoiDung;
    private String maBaiDang;
}