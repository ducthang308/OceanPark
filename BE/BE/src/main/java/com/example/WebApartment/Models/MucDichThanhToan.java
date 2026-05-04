package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "MucDichThanhToan")
@Data
@Builder
public class MucDichThanhToan {
    @Id
    private String maMucDichThanhToan;

    private String tenMucDich;
}