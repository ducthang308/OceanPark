package com.example.WebApartment.DTO;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {

    private Long totalUsers;
    private Long totalPosts;
    private Long pendingPosts;
    private Double totalRevenue;
    private List<ActivityDTO> recentActivity;
}
