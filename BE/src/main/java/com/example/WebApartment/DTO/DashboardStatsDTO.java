package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;
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
    private Long approvedPosts;
    private Long rejectedPosts;
    private Long pendingPayments;
    private Long confirmedPayments;
    private Double totalRevenue;
    private Double monthRevenue;
    private List<MonthlyDashboardPointDTO> monthlyStats;
    private List<DashboardQueueItemDTO> queueItems;
    private List<ActivityDTO> recentActivity;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyDashboardPointDTO {
        private String label;
        private Long approvedPosts;
        private Long pendingPosts;
        private Long confirmedPayments;
        private Double revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardQueueItemDTO {
        private String id;
        private String type;
        private String title;
        private String meta;
        private String status;
        private LocalDateTime createdAt;
    }
}
