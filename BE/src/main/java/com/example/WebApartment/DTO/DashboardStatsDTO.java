package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {

    private Double totalRevenue;

    private Long totalUsers;
    private Long totalRenters;
    private Long totalLandlords;
    private Long totalAdmins;

    private Long totalPosts;
    private Long activePosts;
    private Long rentedPosts;
    private Long pendingPosts;
    private Long pendingPayments;
}
