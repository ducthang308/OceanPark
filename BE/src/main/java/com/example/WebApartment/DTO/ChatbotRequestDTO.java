package com.example.WebApartment.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotRequestDTO {
    private String maNguoiDung;
    private String message;
}