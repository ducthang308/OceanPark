package com.example.WebApartment.DTO;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotSuggestionDTO {
    private String maBaiDang;
    private String tieuDe;
    private String danhMuc;
    private Double gia;
    private Float dienTich;
    private Integer phongNgu;
    private String huongCanHo;
    private String phuong;
    private String diaChi;
    private Integer soLuongTrong;
    private String link;
}
