package com.example.WebApartment.DTO;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotMessageContextDTO {
    private String role;
    private String content;
    private List<ChatbotSuggestionDTO> suggestions;
}
