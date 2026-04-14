package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NhuCauNguoiDungDTO {

    private Long id;
    private Double giaMin;
    private Double giaMax;
    private String khuVuc;
    private String loaiCanHo;
    private Boolean coBanCong;
    private Boolean dayDuNoiThat;
    private Boolean ganBien;
    private Boolean ganTrungTam;

    private Long nguoiDungId;
}
