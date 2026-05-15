package com.example.WebApartment.DTO;

import lombok.*;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPostContentRequest {
    private String loaiCanHo;
    private Double gia;
    private Double dienTich;
    private String diaChi;
    private String phuong;
    private Integer phongNgu;
    private String lienHe;
}