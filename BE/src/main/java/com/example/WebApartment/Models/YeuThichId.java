package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class YeuThichId implements Serializable {

    private Long nguoiDungId;
    private Long baiDangId;
}
