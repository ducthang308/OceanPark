package com.example.WebApartment.DTO;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardChartDTO {
    private List<String> labels;
    private List<Double> values;
    private List<DashboardChartSeriesDTO> series;
}
