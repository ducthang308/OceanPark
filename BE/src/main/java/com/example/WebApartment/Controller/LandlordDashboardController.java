package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.LandlordDashboardDTO;
import com.example.WebApartment.Service.LandlordDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/landlord/dashboard")
@RequiredArgsConstructor
public class LandlordDashboardController {

    private final LandlordDashboardService landlordDashboardService;

    @GetMapping("/{maNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<LandlordDashboardDTO> getStats(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(
                landlordDashboardService.getStats(maNguoiDung)
        );
    }
}