package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NguoiDungDTO {
    private Long id;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String anhDaiDien;
    private String vaiTro;
}
