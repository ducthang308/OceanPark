package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "The")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class The {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tenThe;

    @ManyToMany(mappedBy = "thes")
    private List<BaiDang> baiDangs;
}
