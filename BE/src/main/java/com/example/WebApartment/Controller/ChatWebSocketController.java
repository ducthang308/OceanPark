package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.ChatMessageDTO;
import com.example.WebApartment.DTO.SendMessageRequest;
import com.example.WebApartment.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request) {
        ChatMessageDTO savedMessage = chatService.sendMessage(request);

        messagingTemplate.convertAndSend(
                "/topic/chat-room/" + savedMessage.getMaPhongChat(),
                savedMessage
        );
    }
}