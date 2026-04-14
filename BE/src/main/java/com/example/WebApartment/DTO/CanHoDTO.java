package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CanHoDTO {

    private Double gia;
    private Double dienTich;
    private Integer soPhongNgu;
    private Integer soPhongTam;
    private String diaChi;
    private String phuong;
    private String quan;
    private String thanhPho;
    private Boolean coBanCong;
    private Boolean dayDuNoiThat;
}
