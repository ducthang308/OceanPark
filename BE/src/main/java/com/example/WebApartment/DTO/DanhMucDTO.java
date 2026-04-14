package com.example.WebApartment.DTO;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DanhMucDTO {
    private Long id;
    private String tenDanhMuc;
}