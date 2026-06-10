package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordRevenueChartDTO {
    private String period;
    private String label;
    private Double revenue;
    private Long transactionCount;
}

