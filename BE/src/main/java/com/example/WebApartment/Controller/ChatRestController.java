package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

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
        return ResponseEntity.ok(chatService.sendMessage(request));
    }
}