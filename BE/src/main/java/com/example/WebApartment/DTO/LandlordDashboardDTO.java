package com.example.WebApartment.DTO;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordDashboardDTO {
    private Double totalRevenue;
    private Long totalPosts;
    private Long activePosts;
    private Long rentedPosts;
    private Long totalViews;
    private Long totalLikes;

    private List<LandlordPostStatsDTO> posts;
    private List<LandlordRevenueDTO> revenues;
}
