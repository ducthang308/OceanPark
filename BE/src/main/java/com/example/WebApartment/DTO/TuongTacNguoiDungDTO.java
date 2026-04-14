package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TuongTacNguoiDungDTO {

    private Long id;
    private String loaiHanhDong;

    private Long nguoiDungId;
    private Long baiDangId;
}