package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaiDangYeuThichDTO {

    private String maNguoiDung;
    private String maBaiDang;
    private String tieuDeBaiDang;
    private LocalDateTime ngayTao;
}