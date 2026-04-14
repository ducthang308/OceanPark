package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HinhAnhBaiDangDTO {

    private Long id;
    private String loai;
    private String duongDan;
    private String thumbnail;
    private Integer thuTu;

    private Long baiDangId;
}
