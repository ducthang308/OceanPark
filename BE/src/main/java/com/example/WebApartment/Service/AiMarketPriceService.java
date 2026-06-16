package com.example.WebApartment.Service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiMarketPriceService {

    private static final Logger log = LoggerFactory.getLogger(AiMarketPriceService.class);

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public String advisePrice(String userMessage) {
        return advisePrice(userMessage, "");
    }

    public String advisePrice(String userMessage, String internalMarketContext) {
        String prompt = """
                Bạn là chuyên gia tư vấn giá cho thuê căn hộ tại Đà Nẵng.

                Người dùng là NGƯỜI CHO THUÊ.
                Họ có căn hộ nhưng không biết nên cho thuê giá bao nhiêu.

                Hãy ưu tiên dữ liệu nội bộ bên dưới nếu có, sau đó mới tham khảo dữ liệu thị trường hiện tại bằng web_search.
                Không trả lời kiểu tìm căn hộ cho người thuê.
                Không tự bịa căn hộ, giá, địa chỉ hoặc đường dẫn không có trong dữ liệu nội bộ.

                Yêu cầu:
                - Phân tích đặc điểm căn hộ người dùng mô tả.
                - Ước lượng khoảng giá thuê hợp lý theo tháng.
                - Nêu mức giá nên đăng ban đầu.
                - Nêu chiến lược nếu muốn có khách nhanh.
                - Nếu thiếu địa chỉ cụ thể, hãy nói giá chỉ là khoảng tham khảo.
                - Nếu dữ liệu nội bộ ít hoặc không cùng khu vực, hãy nói rõ đây chỉ là dữ liệu tham khảo.
                - Viết bằng tiếng Việt, rõ ràng, thực tế, dễ hiểu.

                Dữ liệu nội bộ đã truy xuất từ hệ thống:
                %s

                Câu hỏi của người dùng:
                %s
                """.formatted(normalizeContext(internalMarketContext), userMessage);

        String answer = callOpenAiResponses(
                prompt,
                List.of(Map.of("type", (Object) "web_search"))
        );

        if (answer.isBlank()) {
            return "Mình chưa thể tra cứu giá thị trường hiện tại. Bạn có thể cung cấp thêm vị trí cụ thể, diện tích, số phòng ngủ và tình trạng nội thất để mình ước lượng tốt hơn.";
        }

        return answer;
    }

    public String answerApartmentSearch(String userMessage, String internalApartmentContext) {
        String prompt = """
                Bạn là AI Chatbot tư vấn thuê bất động sản cho website cho thuê căn hộ, phòng trọ và nhà tại Đà Nẵng.

                Nhiệm vụ của bạn là trả lời câu hỏi của người thuê dựa trên dữ liệu nội bộ đã được backend truy xuất.

                Quy tắc bắt buộc:
                - Chỉ sử dụng các bài đăng có trong dữ liệu nội bộ.
                - Không tự tạo thêm bài đăng, giá, địa chỉ, mã bài đăng hoặc đường dẫn.
                - Gọi đúng loại theo trường danhMuc; không gọi phòng trọ là căn hộ, không gọi căn hộ là phòng trọ.
                - Nếu dữ liệu nội bộ có bài đăng, nói người dùng xem các gợi ý phù hợp bên dưới.
                - Không nói số lượng gợi ý khác với số dòng dữ liệu nội bộ.
                - Nếu người dùng hỏi hướng căn hộ nhưng chưa có căn khớp hướng, hãy nói chưa thấy căn đúng hướng đó và vẫn giới thiệu các căn gần nhất bên dưới.
                - Nếu người dùng hỏi tiếp về địa chỉ, giá, diện tích, số phòng ngủ hoặc liên hệ, hãy trả lời trực tiếp theo dữ liệu nội bộ.
                - Nếu dữ liệu chưa khớp hoàn toàn, hãy nói rõ điểm nào phù hợp và điểm nào người dùng nên điều chỉnh.
                - Trả lời ngắn gọn, thân thiện, tối đa 5 câu.
                - Không lặp lại toàn bộ bảng dữ liệu; frontend đã hiển thị card gợi ý bên dưới.
                - Không nhắc đến thuật ngữ kỹ thuật như RAG, prompt, database, backend.

                Dữ liệu nội bộ đã truy xuất:
                %s

                Câu hỏi của người dùng:
                %s
                """.formatted(normalizeContext(internalApartmentContext), userMessage);

        return callOpenAiResponses(prompt, List.of());
    }

    private String callOpenAiResponses(String prompt, List<Map<String, Object>> tools) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("input", prompt);

        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
        }

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
            log.warn("OpenAI Responses API call failed: {}", e.getMessage());
            return "";
        }
    }

    private String normalizeContext(String context) {
        if (context == null || context.isBlank()) {
            return "Không có dữ liệu nội bộ phù hợp.";
        }

        return context;
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
