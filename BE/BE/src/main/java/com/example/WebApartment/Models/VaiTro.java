package com.example.WebApartment.Models;


import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "VaiTro")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaiTro {

    @Id
    private String maVaiTro;

    private String tenVaiTro;

    @OneToMany(mappedBy = "vaiTro")
    private List<NguoiDung> nguoiDungs;
}