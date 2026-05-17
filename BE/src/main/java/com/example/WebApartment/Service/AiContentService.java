package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.AiPostContentRequest;
import com.example.WebApartment.DTO.AiPostContentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiContentService {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiPostContentResponse generatePostContent(AiPostContentRequest req) {
        String prompt = """
                Bạn là chuyên gia viết bài đăng cho thuê căn hộ/phòng trọ tại Việt Nam.

                Nhiệm vụ:
                Viết lại bài đăng cho thuê theo phong cách Facebook Marketplace, tự nhiên, dễ đọc, hấp dẫn.

                QUY TẮC BẮT BUỘC:
                - Viết bằng tiếng Việt.
                - Nếu người dùng đã nhập tiêu đề/nội dung, hãy viết lại dựa trên nội dung đó.
                - Không bỏ qua các ý chính người dùng đã nhập.
                - Không bịa thông tin.
                - Không ghi những thông tin bị thiếu hoặc bằng 0.
                - Nếu không có giá hoặc giá bằng 0 thì KHÔNG nhắc đến giá.
                - Nếu không có diện tích hoặc diện tích bằng 0 thì KHÔNG nhắc đến diện tích.
                - Nếu không có số điện thoại thì chỉ viết: "Inbox hoặc liên hệ để xem phòng."
                - Không dùng câu kiểu "Chưa cung cấp", "Liên hệ để biết thêm chi tiết" lặp lại nhiều lần.
                - Nội dung phải ngắn gọn, xuống dòng rõ, giống bài đăng thật trên Facebook.
                - Có thể dùng emoji vừa phải.
                - Không viết đoạn văn dài lê thê.
                - Không tự thêm điện, nước, wifi, nội thất nếu không có trong dữ liệu.

                Dữ liệu hiện có:
                %s

                Trả về đúng format, không thêm giải thích:
                TIEU_DE: ...
                NOI_DUNG: ...
                """.formatted(buildAvailableInfo(req));

        Map<String, Object> body = Map.of(
                "model", model,
                "input", prompt
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.openai.com/v1/responses",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );

            String outputText = extractOutputText(response.getBody());
            return parseOutput(outputText);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Không thể gọi OpenAI API: " + e.getMessage());
        }
    }

    private String buildAvailableInfo(AiPostContentRequest req) {
        StringBuilder sb = new StringBuilder();

        if (hasText(req.getTieuDeHienTai())) {
            sb.append("- Tiêu đề người dùng nhập: ")
                    .append(req.getTieuDeHienTai())
                    .append("\n");
        }

        if (hasText(req.getNoiDungHienTai())) {
            sb.append("- Nội dung người dùng nhập: ")
                    .append(req.getNoiDungHienTai())
                    .append("\n");
        }

        if (hasText(req.getLoaiCanHo())) {
            sb.append("- Loại căn hộ: ").append(req.getLoaiCanHo()).append("\n");
        }

        if (req.getGia() != null && req.getGia() > 0) {
            sb.append("- Giá thuê: ")
                    .append(String.format("%,.0f", req.getGia()))
                    .append(" VNĐ/tháng\n");
        }

        if (req.getDienTich() != null && req.getDienTich() > 0) {
            sb.append("- Diện tích: ").append(req.getDienTich()).append(" m2\n");
        }

        if (hasText(req.getDiaChi())) {
            sb.append("- Địa chỉ: ").append(req.getDiaChi()).append("\n");
        }

        if (hasText(req.getPhuong())) {
            sb.append("- Khu vực: ").append(req.getPhuong()).append("\n");
        }

        if (req.getPhongNgu() != null && req.getPhongNgu() > 0) {
            sb.append("- Số phòng ngủ: ").append(req.getPhongNgu()).append("\n");
        }

        if (hasText(req.getLienHe())) {
            sb.append("- Liên hệ: ").append(req.getLienHe()).append("\n");
        }

        if (sb.isEmpty()) {
            sb.append("- Người dùng chưa nhập nhiều thông tin, hãy viết bài ngắn dạng gợi mở.\n");
        }

        return sb.toString();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isBlank();
    }

    private String extractOutputText(Map body) {
        if (body == null) return "";

        Object output = body.get("output");
        if (!(output instanceof List<?> outputList)) return "";

        StringBuilder sb = new StringBuilder();

        for (Object item : outputList) {
            if (!(item instanceof Map<?, ?> itemMap)) continue;

            Object content = itemMap.get("content");
            if (!(content instanceof List<?> contentList)) continue;

            for (Object c : contentList) {
                if (c instanceof Map<?, ?> cMap) {
                    Object text = cMap.get("text");
                    if (text != null) sb.append(text);
                }
            }
        }

        return sb.toString();
    }

    private AiPostContentResponse parseOutput(String text) {
        String title = "Căn hộ cho thuê phù hợp, liên hệ xem phòng";
        String content = text == null ? "" : text.trim();

        if (content.contains("TIEU_DE:")) {
            String[] parts = content.split("NOI_DUNG:", 2);

            title = parts[0]
                    .replace("TIEU_DE:", "")
                    .trim();

            if (parts.length > 1) {
                content = parts[1].trim();
            }
        }

        return AiPostContentResponse.builder()
                .tieuDe(title)
                .noiDung(content)
                .build();
    }
}