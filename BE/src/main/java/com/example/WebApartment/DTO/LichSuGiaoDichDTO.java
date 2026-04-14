package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LichSuGiaoDichDTO {

    private Long id;
    private Double soTien;
    private String trangThai;

    private Long nguoiDungId;
    private Long phuongThucId;
}
