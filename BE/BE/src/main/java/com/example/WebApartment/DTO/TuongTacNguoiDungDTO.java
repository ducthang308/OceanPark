package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
public class TuongTacNguoiDungDTO {
    private String maTuongTacNguoiDung;
    private String maNguoiDung;
    private String maBaiDang;

    private String loaiHanhDong;
    private LocalDateTime ngayTao;
}
