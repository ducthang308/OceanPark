package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityDTO {

    private String id;
    private String type;
    private String description;
    private LocalDateTime timestamp;
}
