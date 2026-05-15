package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.AiPostContentRequest;
import com.example.WebApartment.DTO.AiPostContentResponse;
import com.example.WebApartment.Service.AiContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/ai")
@RequiredArgsConstructor
public class AiContentController {

    private final AiContentService aiContentService;

    @PostMapping("/generate-post-content")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<AiPostContentResponse> generatePostContent(
            @RequestBody AiPostContentRequest request
    ) {
        return ResponseEntity.ok(aiContentService.generatePostContent(request));
    }
}