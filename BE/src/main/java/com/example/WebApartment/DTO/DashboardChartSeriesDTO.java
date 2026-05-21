package com.example.WebApartment.DTO;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardChartSeriesDTO {
    private String name;
    private List<Double> values;
}
