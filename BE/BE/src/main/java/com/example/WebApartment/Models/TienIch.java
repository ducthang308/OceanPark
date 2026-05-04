package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tienich")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TienIch {

    @Id
    @Column(name = "maTienIch", length = 36)
    private String maTienIch;

    @Column(name = "tenTienIch", nullable = false, length = 100)
    private String tenTienIch;
}