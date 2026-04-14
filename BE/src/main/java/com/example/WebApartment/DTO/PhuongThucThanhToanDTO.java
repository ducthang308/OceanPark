package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PhuongThucThanhToanDTO {

    private Long id;
    private String tenPhuongThuc;
    private String moTa;
}