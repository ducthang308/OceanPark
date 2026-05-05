package com.example.WebApartment.Models;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "LichSuTimKiem")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LichSuTimKiem {

    @Id
    private String maLichSuTimKiem;

    @ManyToOne
    @JoinColumn(name = "maNguoiDung")
    private NguoiDung nguoiDung;

    private String tuKhoa;
    private Double minPrice;
    private Double maxPrice;
    private String phuong;
    private java.time.LocalDateTime thoiGian;
}