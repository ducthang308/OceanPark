package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.DashboardStatsDTO;
import com.example.WebApartment.DTO.DashboardChartDTO;
import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping({"/stats", "/statistics", "/overview"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getStats() {
        return ResponseEntity.ok(adminDashboardService.getOverview());
    }

    @GetMapping("/revenue-chart")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardChartDTO> getRevenueChart(
            @RequestParam(defaultValue = "month") String type
    ) {
        return ResponseEntity.ok(adminDashboardService.getRevenueChart(type));
    }

    @GetMapping("/post-chart")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardChartDTO> getPostChart(
            @RequestParam(defaultValue = "month") String type
    ) {
        return ResponseEntity.ok(adminDashboardService.getPostChart(type));
    }

    @GetMapping("/user-chart")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardChartDTO> getUserChart() {
        return ResponseEntity.ok(adminDashboardService.getUserChart());
    }

    @GetMapping("/pending-posts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BaiDangDTO>> getPendingPosts(
            @RequestParam(defaultValue = "6") Integer limit
    ) {
        return ResponseEntity.ok(adminDashboardService.getPendingPosts(limit));
    }
}
