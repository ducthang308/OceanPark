package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;


@Entity
@Table(name = "VaiTro")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VaiTro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenVaiTro", nullable = false)
    private String tenVaiTro;

    @OneToMany(mappedBy = "vaiTro")
    private List<NguoiDung> nguoiDungs;
}
