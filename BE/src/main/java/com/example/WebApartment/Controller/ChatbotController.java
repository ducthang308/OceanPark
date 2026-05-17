package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.ChatbotRequestDTO;
import com.example.WebApartment.DTO.ChatbotResponseDTO;
import com.example.WebApartment.Service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE','NGUOI_THUE')")
    public ResponseEntity<ChatbotResponseDTO> ask(
            @RequestBody ChatbotRequestDTO request
    ) {
        return ResponseEntity.ok(chatbotService.ask(request));
    }
}