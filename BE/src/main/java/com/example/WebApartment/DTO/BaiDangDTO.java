package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaiDangDTO {

    private String maBaiDang;
    private String maNguoiDung;
    private String maDanhMuc;

    private String tieuDe;
    private String noiDung;
    private LocalDateTime ngayDang;
    private String trangThai;
    private String lienHe;
    private String hinhThucThanhToan;
    private Long luotXem;

    private Integer recommendationScore;
    private List<String> recommendationReasons;
    private String aiSuggestion;
}
