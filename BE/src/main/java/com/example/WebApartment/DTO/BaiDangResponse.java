package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BaiDangResponse {

    private Long id;
    private String tieuDe;
    private String noiDung;
    private String trangThai;
    private String lienHe;
    private String hinhThucThanhToan;

    private NguoiDungDTO nguoiDung;
    private DanhMucDTO danhMuc;
    private CanHoDTO canHo;

    private List<TienIchDTO> tienIchs;
    private List<TheDTO> thes;
}
