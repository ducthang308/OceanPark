package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomDTO {
    private String maPhongChat;
    private String loaiPhongChat;

    private String maNguoiDung1;
    private String tenNguoiDung1;

    private String maNguoiDung2;
    private String tenNguoiDung2;

    private String maBaiDang;
    private String tieuDeBaiDang;

    private String tinNhanCuoi;
    private LocalDateTime thoiGianTinNhanCuoi;
    private LocalDateTime ngayTao;
}