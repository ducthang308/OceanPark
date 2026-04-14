package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LichSuTimKiemDTO {

    private Long id;
    private String tuKhoa;
    private Double giaMin;
    private Double giaMax;
    private String quan;

    private Long nguoiDungId;
}
