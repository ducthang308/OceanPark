package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.RentPriceAnalysisRequest;
import com.example.WebApartment.DTO.RentPriceAnalysisResponse;
import com.example.WebApartment.Service.AiRentPriceAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/ai")
@RequiredArgsConstructor
public class AiRentPriceAnalysisController {

    private final AiRentPriceAnalysisService service;

    @PostMapping("/rent-price-analysis")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<RentPriceAnalysisResponse> analyze(
            @RequestBody RentPriceAnalysisRequest request
    ) {
        return ResponseEntity.ok(service.analyze(request));
    }
}