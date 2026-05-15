package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/recommendation")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/{maNguoiDung}")
    public ResponseEntity<List<BaiDangDTO>> recommend(
            @PathVariable String maNguoiDung
    ) {

        return ResponseEntity.ok(
                recommendationService.recommend(maNguoiDung)
        );
    }
}