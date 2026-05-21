package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {
    private String maPhongChat;
    private String maNguoiGui;
    private String noiDung;
    private String loaiTinNhan;
    private String tepDinhKemUrl;
}