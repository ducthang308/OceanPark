package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "TienIch")
@Data
@Builder
public class TienIch {

    @Id
    private String maTienIch;

    private String tenTienIch;
}