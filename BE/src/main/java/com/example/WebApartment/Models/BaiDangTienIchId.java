package com.example.WebApartment.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaiDangTienIchId implements Serializable {

    @Column(name = "maBaiDang")
    private String maBaiDang;

    @Column(name = "maTienIch")
    private String maTienIch;
}