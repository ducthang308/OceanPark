package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BaiDangRequest {

    private String tieuDe;
    private String noiDung;
    private String lienHe;
    private String hinhThucThanhToan;

    private Long nguoiDungId;
    private Long danhMucId;

    private CanHoDTO canHo;

    private List<Long> tienIchIds;
    private List<Long> theIds;
}