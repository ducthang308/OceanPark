package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatNotificationDTO {
    private String maPhongChat;
    private String maTinNhan;
    private String maNguoiGui;
    private String tenNguoiGui;
    private String noiDung;
    private String loaiTinNhan;
    private LocalDateTime thoiGianGui;
    private String tieuDeBaiDang;
}
