package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Models.*;
import com.example.WebApartment.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final PhongChatRepository phongChatRepository;
    private final TinNhanRepository tinNhanRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;

    @Transactional
    public ChatRoomDTO getOrCreateRoom(CreateChatRoomRequest request) {
        String user1 = request.getMaNguoiDung1();
        String user2 = request.getMaNguoiDung2();
        String loai = request.getLoaiPhongChat();

        PhongChat existing = phongChatRepository
                .findByNguoiDung1_MaNguoiDungAndNguoiDung2_MaNguoiDungAndLoaiPhongChat(user1, user2, loai)
                .or(() -> phongChatRepository
                        .findByNguoiDung2_MaNguoiDungAndNguoiDung1_MaNguoiDungAndLoaiPhongChat(user1, user2, loai))
                .orElse(null);

        if (existing != null) {
            return toRoomDTO(existing);
        }

        NguoiDung nguoiDung1 = nguoiDungRepository.findById(user1)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng 1"));

        NguoiDung nguoiDung2 = nguoiDungRepository.findById(user2)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng 2"));

        BaiDang baiDang = null;
        if (request.getMaBaiDang() != null && !request.getMaBaiDang().isBlank()) {
            baiDang = baiDangRepository.findById(request.getMaBaiDang())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        }

        LocalDateTime now = LocalDateTime.now();

        PhongChat room = PhongChat.builder()
                .maPhongChat(generateId("PC"))
                .loaiPhongChat(loai)
                .nguoiDung1(nguoiDung1)
                .nguoiDung2(nguoiDung2)
                .baiDang(baiDang)
                .tinNhanCuoi("")
                .thoiGianTinNhanCuoi(now)
                .ngayTao(now)
                .build();

        return toRoomDTO(phongChatRepository.save(room));
    }

    public List<ChatRoomDTO> getRoomsByUser(String maNguoiDung) {
        return phongChatRepository
                .findByNguoiDung1_MaNguoiDungOrNguoiDung2_MaNguoiDungOrderByThoiGianTinNhanCuoiDesc(
                        maNguoiDung,
                        maNguoiDung
                )
                .stream()
                .map(this::toRoomDTO)
                .toList();
    }

    public List<ChatMessageDTO> getMessages(String maPhongChat) {
        return tinNhanRepository
                .findByPhongChat_MaPhongChatOrderByThoiGianGuiAsc(maPhongChat)
                .stream()
                .map(this::toMessageDTO)
                .toList();
    }

    @Transactional
    public ChatMessageDTO sendMessage(SendMessageRequest request) {
        PhongChat room = phongChatRepository.findById(request.getMaPhongChat())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng chat"));

        NguoiDung sender = nguoiDungRepository.findById(request.getMaNguoiGui())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));

        LocalDateTime now = LocalDateTime.now();

        TinNhan message = TinNhan.builder()
                .maTinNhan(generateId("TN"))
                .phongChat(room)
                .nguoiGui(sender)
                .noiDung(request.getNoiDung())
                .loaiTinNhan(request.getLoaiTinNhan() == null ? "TEXT" : request.getLoaiTinNhan())
                .tepDinhKemUrl(request.getTepDinhKemUrl())
                .trangThai("SENT")
                .thoiGianGui(now)
                .build();

        TinNhan saved = tinNhanRepository.save(message);

        room.setTinNhanCuoi(request.getNoiDung());
        room.setThoiGianTinNhanCuoi(now);
        phongChatRepository.save(room);

        return toMessageDTO(saved);
    }

    private ChatRoomDTO toRoomDTO(PhongChat room) {
        return ChatRoomDTO.builder()
                .maPhongChat(room.getMaPhongChat())
                .loaiPhongChat(room.getLoaiPhongChat())
                .maNguoiDung1(room.getNguoiDung1() != null ? room.getNguoiDung1().getMaNguoiDung() : null)
                .tenNguoiDung1(room.getNguoiDung1() != null ? room.getNguoiDung1().getHoVaTen() : null)
                .maNguoiDung2(room.getNguoiDung2() != null ? room.getNguoiDung2().getMaNguoiDung() : null)
                .tenNguoiDung2(room.getNguoiDung2() != null ? room.getNguoiDung2().getHoVaTen() : null)
                .maBaiDang(room.getBaiDang() != null ? room.getBaiDang().getMaBaiDang() : null)
                .tieuDeBaiDang(room.getBaiDang() != null ? room.getBaiDang().getTieuDe() : null)
                .tinNhanCuoi(room.getTinNhanCuoi())
                .thoiGianTinNhanCuoi(room.getThoiGianTinNhanCuoi())
                .ngayTao(room.getNgayTao())
                .build();
    }

    private ChatMessageDTO toMessageDTO(TinNhan message) {
        return ChatMessageDTO.builder()
                .maTinNhan(message.getMaTinNhan())
                .maPhongChat(message.getPhongChat() != null ? message.getPhongChat().getMaPhongChat() : null)
                .maNguoiGui(message.getNguoiGui() != null ? message.getNguoiGui().getMaNguoiDung() : null)
                .tenNguoiGui(message.getNguoiGui() != null ? message.getNguoiGui().getHoVaTen() : null)
                .noiDung(message.getNoiDung())
                .loaiTinNhan(message.getLoaiTinNhan())
                .tepDinhKemUrl(message.getTepDinhKemUrl())
                .trangThai(message.getTrangThai())
                .thoiGianGui(message.getThoiGianGui())
                .build();
    }

    private String generateId(String prefix) {
        return prefix + UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }
}