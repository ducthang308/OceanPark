package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
public class LichSuTimKiemDTO {
    private String maLichSuTimKiem;
    private String maNguoiDung;

    private String tuKhoa;
    private Double minPrice;
    private Double maxPrice;
    private String phuong;

    private LocalDateTime thoiGian;
}
