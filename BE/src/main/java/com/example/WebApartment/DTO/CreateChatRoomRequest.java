package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateChatRoomRequest {
    private String maNguoiDung1;
    private String maNguoiDung2;
    private String maBaiDang;
    private String loaiPhongChat;
}