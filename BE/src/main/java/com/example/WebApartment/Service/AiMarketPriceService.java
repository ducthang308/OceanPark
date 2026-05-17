package com.example.WebApartment.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiMarketPriceService {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public String advisePrice(String userMessage) {
        String prompt = """
                Bạn là chuyên gia tư vấn giá cho thuê căn hộ tại Đà Nẵng.

                Người dùng là NGƯỜI CHO THUÊ.
                Họ có căn hộ nhưng không biết nên cho thuê giá bao nhiêu.

                Hãy dùng dữ liệu thị trường hiện tại nếu có thể.
                Không dựa vào database nội bộ.
                Không trả lời kiểu tìm căn hộ cho người thuê.

                Yêu cầu:
                - Phân tích đặc điểm căn hộ người dùng mô tả.
                - Ước lượng khoảng giá thuê hợp lý theo tháng.
                - Nêu mức giá nên đăng ban đầu.
                - Nêu chiến lược nếu muốn có khách nhanh.
                - Nếu thiếu địa chỉ cụ thể, hãy nói giá chỉ là khoảng tham khảo.
                - Viết bằng tiếng Việt, rõ ràng, thực tế, dễ hiểu.

                Câu hỏi của người dùng:
                %s
                """.formatted(userMessage);

        Map<String, Object> body = Map.of(
                "model", model,
                "tools", List.of(
                        Map.of("type", "web_search")
                ),
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

            return extractOutputText(response.getBody());

        } catch (Exception e) {
            e.printStackTrace();
            return "Mình chưa thể tra cứu giá thị trường hiện tại. Bạn có thể cung cấp thêm vị trí cụ thể, diện tích, số phòng ngủ và tình trạng nội thất để mình ước lượng tốt hơn.";
        }
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
}