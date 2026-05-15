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
                Bạn là chuyên gia viết bài đăng cho thuê căn hộ tại Việt Nam.
                Hãy tạo tiêu đề và nội dung mô tả hấp dẫn, tự nhiên, rõ ràng.
                Không nói quá sự thật. Không dùng emoji quá nhiều.

                Thông tin căn hộ:
                - Loại căn hộ: %s
                - Giá: %s VNĐ/tháng
                - Diện tích: %s m2
                - Địa chỉ: %s
                - Phường/Khu vực: %s
                - Số phòng ngủ: %s
                - Liên hệ: %s

                Trả về đúng format:
                TIEU_DE: ...
                NOI_DUNG: ...
                """.formatted(
                safe(req.getLoaiCanHo()),
                req.getGia(),
                req.getDienTich(),
                safe(req.getDiaChi()),
                safe(req.getPhuong()),
                req.getPhongNgu(),
                safe(req.getLienHe())
        );

        Map<String, Object> body = Map.of(
                "model", model,
                "input", prompt
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.openai.com/v1/responses",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
        );

        String outputText = extractOutputText(response.getBody());

        return parseOutput(outputText);
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
        String title = "Căn hộ cho thuê tiện nghi, giá tốt";
        String content = text;

        if (text != null && text.contains("TIEU_DE:")) {
            String[] parts = text.split("NOI_DUNG:");

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

    private String safe(String value) {
        return value == null ? "Chưa cung cấp" : value;
    }
}