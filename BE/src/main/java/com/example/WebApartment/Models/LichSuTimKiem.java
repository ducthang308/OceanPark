package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "LichSuTimKiem")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LichSuTimKiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tuKhoa;
    private Double giaMin;
    private Double giaMax;
    private String quan;

    @ManyToOne
    @JoinColumn(name = "nguoiDungId")
    private NguoiDung nguoiDung;
}
