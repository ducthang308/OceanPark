package com.example.WebApartment.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
public class BaiDangTienIchId implements java.io.Serializable {
    private String maBaiDang;
    private String maTienIch;
}