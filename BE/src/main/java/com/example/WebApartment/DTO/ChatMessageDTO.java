package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private String maTinNhan;
    private String maPhongChat;

    private String maNguoiGui;
    private String tenNguoiGui;

    private String noiDung;
    private String loaiTinNhan;
    private String tepDinhKemUrl;
    private String trangThai;
    private LocalDateTime thoiGianGui;
}