package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "TienIch")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TienIch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tenTienIch;

    @ManyToMany(mappedBy = "tienIchs")
    private List<BaiDang> baiDangs;
}
