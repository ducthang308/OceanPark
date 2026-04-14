package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GoiDangKyDTO {

    private Long id;
    private Double soTien;
    private String trangThai;

    private LocalDate ngayBatDau;
    private LocalDate ngayKetThuc;

    private Long nguoiDungId;
    private Long phuongThucId;
}
