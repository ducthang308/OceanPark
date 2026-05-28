package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Models.TinNhan;
import com.example.WebApartment.Repository.TinNhanRepository;
import com.example.WebApartment.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TinNhanRepository tinNhanRepository;

    @PostMapping("/rooms")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<ChatRoomDTO> getOrCreateRoom(
            @RequestBody CreateChatRoomRequest request
    ) {
        return ResponseEntity.ok(chatService.getOrCreateRoom(request));
    }

    @GetMapping("/rooms/user/{maNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<List<ChatRoomDTO>> getRoomsByUser(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(chatService.getRoomsByUser(maNguoiDung));
    }

    @GetMapping("/rooms/{maPhongChat}/messages")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(
            @PathVariable String maPhongChat
    ) {
        return ResponseEntity.ok(chatService.getMessages(maPhongChat));
    }

    @PostMapping("/messages")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<ChatMessageDTO> sendMessageRest(
            @RequestBody SendMessageRequest request
    ) {
        ChatMessageDTO savedMessage = chatService.sendMessage(request);
        broadcastChatUpdate(savedMessage);

        return ResponseEntity.ok(savedMessage);
    }

    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<ChatAttachmentDTO> uploadAttachment(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.status(201).body(chatService.uploadChatImage(file));
    }

    private void broadcastChatUpdate(ChatMessageDTO savedMessage) {
        messagingTemplate.convertAndSend(
                "/topic/chat-room/" + savedMessage.getMaPhongChat(),
                savedMessage
        );

        try {
            ChatRoomDTO room = chatService.getRoomById(savedMessage.getMaPhongChat());
            TinNhan tinNhan = tinNhanRepository.findById(savedMessage.getMaTinNhan())
                    .orElse(null);

            if (tinNhan == null) {
                return;
            }

            ChatNotificationDTO notification = chatService.toNotificationDTO(tinNhan);

            if (room.getMaNguoiDung1() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/user/" + room.getMaNguoiDung1() + "/chat-notification",
                        notification
                );
            }

            if (room.getMaNguoiDung2() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/user/" + room.getMaNguoiDung2() + "/chat-notification",
                        notification
                );
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi broadcast REST chat notification: " + e.getMessage());
        }
    }
}
