package com.example.WebApartment.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotSuggestionDTO {
    private String maBaiDang;
    private String tieuDe;
    private Double gia;
    private String phuong;
    private String diaChi;
    private String link;
}