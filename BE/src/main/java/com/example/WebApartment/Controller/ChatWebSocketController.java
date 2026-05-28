package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.ChatMessageDTO;
import com.example.WebApartment.DTO.ChatNotificationDTO;
import com.example.WebApartment.DTO.ChatRoomDTO;
import com.example.WebApartment.DTO.SendMessageRequest;
import com.example.WebApartment.Models.TinNhan;
import com.example.WebApartment.Repository.TinNhanRepository;
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
    private final TinNhanRepository tinNhanRepository;

    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request) {
        // 1. Save message và get saved message
        ChatMessageDTO savedMessage = chatService.sendMessage(request);

        // 2. Broadcast tin nhắn đến room
        messagingTemplate.convertAndSend(
                "/topic/chat-room/" + savedMessage.getMaPhongChat(),
                savedMessage
        );

        // 3. Broadcast notification đến cả 2 user
        try {
            ChatRoomDTO room = chatService.getRoomById(savedMessage.getMaPhongChat());

            // Lấy TinNhan từ database để có đầy đủ thông tin
            TinNhan tinNhan = tinNhanRepository.findById(savedMessage.getMaTinNhan())
                    .orElse(null);

            if (tinNhan != null) {
                ChatNotificationDTO notification = chatService.toNotificationDTO(tinNhan);

                // Gửi notification đến user 1
                if (room.getMaNguoiDung1() != null) {
                    messagingTemplate.convertAndSend(
                            "/topic/user/" + room.getMaNguoiDung1() + "/chat-notification",
                            notification
                    );
                }

                // Gửi notification đến user 2
                if (room.getMaNguoiDung2() != null) {
                    messagingTemplate.convertAndSend(
                            "/topic/user/" + room.getMaNguoiDung2() + "/chat-notification",
                            notification
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi broadcast notification: " + e.getMessage());
            // Không throw error, chỉ log - main message đã sent
        }
    }
}
