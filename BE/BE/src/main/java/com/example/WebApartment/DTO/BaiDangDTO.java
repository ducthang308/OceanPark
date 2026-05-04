package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDate;
import java.util.Date;

@Data
public class BaiDangDTO {
    private String maBaiDang;
    private String maNguoiDung;
    private String maDanhMuc;

    private String tieuDe;
    private String noiDung;
    private Date ngayDang;
    private String trangThai;
    private String lienHe;
    private String phuongThucThanhToan;
}
