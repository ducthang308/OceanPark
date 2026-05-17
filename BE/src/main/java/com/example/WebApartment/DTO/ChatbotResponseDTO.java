package com.example.WebApartment.DTO;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotResponseDTO {
    private String answer;
    private String intent;
    private List<ChatbotSuggestionDTO> suggestions;
}