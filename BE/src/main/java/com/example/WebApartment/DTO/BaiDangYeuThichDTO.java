package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
public class BaiDangYeuThichDTO {
    private String maNguoiDung;
    private String maBaiDang;
    private LocalDateTime ngayTao;
}