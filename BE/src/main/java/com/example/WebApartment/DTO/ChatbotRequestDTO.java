package com.example.WebApartment.DTO;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotRequestDTO {
    private String maNguoiDung;
    private String message;
    private List<ChatbotMessageContextDTO> history;
}
