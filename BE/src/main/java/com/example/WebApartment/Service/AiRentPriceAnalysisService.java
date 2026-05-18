package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.RentPriceAnalysisRequest;
import com.example.WebApartment.DTO.RentPriceAnalysisResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiRentPriceAnalysisService {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model}")
    private String model;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public RentPriceAnalysisResponse analyze(RentPriceAnalysisRequest req) {
        String prompt = """
                Bạn là chuyên gia định giá căn hộ cho thuê tại Đà Nẵng.

                Hãy phân tích độ hợp lý của giá thuê do người cho thuê đề xuất.

                Yêu cầu:
                - Trả lời bằng tiếng Việt.
                - Không nói chung chung.
                - Phân tích dựa trên vị trí, diện tích, số phòng ngủ, tiện ích và giá đề xuất.
                - Nếu thiếu dữ liệu, vẫn đưa ra khoảng tham khảo hợp lý.
                - Không bịa dữ liệu cụ thể như tên dự án nếu không có.
                - Trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.

                Quy ước mucDoHopLy:
                - "THAP_HON_THI_TRUONG"
                - "HOP_LY"
                - "CAO_HON_THI_TRUONG"

                Thông tin căn hộ:
                - Loại căn hộ: %s
                - Giá đề xuất: %s VNĐ/tháng
                - Diện tích: %s m2
                - Phường/Khu vực: %s
                - Địa chỉ: %s
                - Số phòng ngủ: %s
                - Có ban công: %s
                - Đầy đủ nội thất: %s
                - Có máy lạnh: %s
                - Có thang máy: %s
                - Có máy giặt: %s
                - Có nhà xe: %s
                - Có tủ lạnh: %s
                - Giờ giấc tự do: %s
                - Gần trung tâm: %s
                - Gần biển: %s

                Format JSON:
                {
                  "mucDoHopLy": "HOP_LY",
                  "giaThap": 0,
                  "giaCao": 0,
                  "giaKhuyenNghi": 0,
                  "nhanXet": "...",
                  "chienLuoc": "..."
                }
                """.formatted(
                safe(req.getLoaiCanHo()),
                req.getGiaDeXuat() == null ? "Chưa cung cấp" : req.getGiaDeXuat(),
                req.getDienTich() == null ? "Chưa cung cấp" : req.getDienTich(),
                safe(req.getPhuong()),
                safe(req.getDiaChi()),
                req.getPhongNgu() == null ? "Chưa cung cấp" : req.getPhongNgu(),
                bool(req.getCoBanCong()),
                bool(req.getDayDuNoiThat()),
                bool(req.getCoMayLanh()),
                bool(req.getCoThangMay()),
                bool(req.getCoMayGiat()),
                bool(req.getCoNhaXe()),
                bool(req.getCoTuLanh()),
                bool(req.getGioGiacTuDo()),
                bool(req.getGanTrungTam()),
                bool(req.getGanBien())
        );

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

            String output = extractOutputText(response.getBody());

            return parseJson(output);

        } catch (Exception e) {
            e.printStackTrace();

            return RentPriceAnalysisResponse.builder()
                    .mucDoHopLy("CHUA_XAC_DINH")
                    .giaThap(0D)
                    .giaCao(0D)
                    .giaKhuyenNghi(req.getGiaDeXuat() != null ? req.getGiaDeXuat() : 0D)
                    .nhanXet("Hiện chưa thể phân tích bằng AI. Vui lòng kiểm tra lại API key hoặc thử lại sau.")
                    .chienLuoc("Bạn nên nhập đầy đủ khu vực, diện tích, số phòng ngủ và tiện ích để AI tư vấn chính xác hơn.")
                    .build();
        }
    }

    private RentPriceAnalysisResponse parseJson(String output) {
        try {
            String json = output
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            JsonNode node = objectMapper.readTree(json);

            return RentPriceAnalysisResponse.builder()
                    .mucDoHopLy(node.path("mucDoHopLy").asText("CHUA_XAC_DINH"))
                    .giaThap(node.path("giaThap").asDouble(0D))
                    .giaCao(node.path("giaCao").asDouble(0D))
                    .giaKhuyenNghi(node.path("giaKhuyenNghi").asDouble(0D))
                    .nhanXet(node.path("nhanXet").asText(""))
                    .chienLuoc(node.path("chienLuoc").asText(""))
                    .build();

        } catch (Exception e) {
            return RentPriceAnalysisResponse.builder()
                    .mucDoHopLy("CHUA_XAC_DINH")
                    .giaThap(0D)
                    .giaCao(0D)
                    .giaKhuyenNghi(0D)
                    .nhanXet(output)
                    .chienLuoc("AI đã trả lời không đúng định dạng JSON. Cần thử lại.")
                    .build();
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

    private String safe(String value) {
        return value == null || value.isBlank() ? "Chưa cung cấp" : value;
    }

    private String bool(Boolean value) {
        if (value == null) return "Chưa cung cấp";
        return value ? "Có" : "Không";
    }
}