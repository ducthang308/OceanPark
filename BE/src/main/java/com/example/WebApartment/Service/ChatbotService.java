package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChiTietCanHoRepository chiTietCanHoRepository;
    private final AiMarketPriceService aiMarketPriceService;

    public ChatbotResponseDTO ask(ChatbotRequestDTO request) {
        String message = request.getMessage() == null
                ? ""
                : request.getMessage().toLowerCase();

        if (!isRealEstateRelated(message)) {
            return ChatbotResponseDTO.builder()
                    .intent("OUT_OF_SCOPE")
                    .answer("Mình chỉ hỗ trợ tư vấn thuê căn hộ, tìm phòng, gợi ý bài đăng và tư vấn giá cho thuê. Bạn có thể hỏi ví dụ: “Tầm 5 triệu ở Hải Châu có căn nào không?”")
                    .suggestions(List.of())
                    .build();
        }

        if (isPriceAdviceIntent(message)) {
            return adviseMarketPrice(message);
        }

        return searchApartments(message);
    }

    private boolean isRealEstateRelated(String message) {
        List<String> keywords = List.of(
                "căn hộ", "phòng", "phòng trọ", "nhà", "chung cư",
                "thuê", "cho thuê", "giá", "diện tích", "m2", "m²",
                "ban công", "nội thất", "view", "gần", "địa chỉ",
                "hải châu", "sơn trà", "đà nẵng", "an hải",
                "mỹ khê", "1pn", "2pn", "studio"
        );

        return keywords.stream().anyMatch(message::contains);
    }

    private ChatbotResponseDTO searchApartments(String message) {
        Double maxPrice = extractPrice(message);
        String phuong = extractLocation(message);

        List<ChiTietCanHo> results;

        if (maxPrice != null && phuong != null) {
            results = chiTietCanHoRepository
                    .findByGiaLessThanEqualAndPhuongContainingIgnoreCase(maxPrice, phuong);
        } else if (maxPrice != null) {
            results = chiTietCanHoRepository.findByGiaLessThanEqual(maxPrice);
        } else if (phuong != null) {
            results = chiTietCanHoRepository.findByPhuongContainingIgnoreCase(phuong);
        } else {
            results = chiTietCanHoRepository.findAll();
        }

        List<ChatbotSuggestionDTO> suggestions = results.stream()
                .filter(ct -> ct.getBaiDang() != null)
                .filter(ct -> "ACTIVE".equalsIgnoreCase(ct.getBaiDang().getTrangThai()))
                .limit(5)
                .map(this::toSuggestion)
                .toList();

        String answer;

        if (suggestions.isEmpty()) {
            answer = "Mình chưa tìm thấy căn hộ phù hợp với yêu cầu này. Bạn có thể thử khoảng giá hoặc khu vực khác nhé.";
        } else {
            answer = "Mình tìm thấy một số căn hộ phù hợp với nhu cầu của bạn:";
        }

        return ChatbotResponseDTO.builder()
                .intent("SEARCH_APARTMENT")
                .answer(answer)
                .suggestions(suggestions)
                .build();
    }

    private ChatbotResponseDTO adviseMarketPrice(String message) {
        String answer = aiMarketPriceService.advisePrice(message);

        return ChatbotResponseDTO.builder()
                .intent("PRICE_ADVICE")
                .answer(answer)
                .suggestions(List.of())
                .build();
    }

    private boolean isPriceAdviceIntent(String message) {

        List<String> keywords = List.of(
                "giá bao nhiêu",
                "nên cho thuê",
                "nên bán",
                "định giá",
                "giá thị trường",
                "tư vấn giá",
                "giá hợp lý",
                "giá hiện tại",
                "cho thuê bao nhiêu",
                "nên để giá",
                "giá thuê",
                "market",
                "thị trường"
        );

        return keywords.stream()
                .anyMatch(message::contains);
    }

    private Double extractPrice(String message) {
        Pattern pattern = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(triệu|trieu|tr|k|nghìn|nghin)");
        Matcher matcher = pattern.matcher(message);

        if (matcher.find()) {
            double number = Double.parseDouble(matcher.group(1).replace(",", "."));
            String unit = matcher.group(2);

            if (unit.contains("triệu") || unit.contains("trieu") || unit.equals("tr")) {
                return number * 1_000_000;
            }

            if (unit.contains("k") || unit.contains("nghìn") || unit.contains("nghin")) {
                return number * 1_000;
            }
        }

        return null;
    }

    private Double extractArea(String message) {
        Pattern pattern = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(m2|m²)");
        Matcher matcher = pattern.matcher(message);

        if (matcher.find()) {
            return Double.parseDouble(matcher.group(1).replace(",", "."));
        }

        return null;
    }

    private String extractLocation(String message) {
        List<String> locations = List.of(
                "hải châu",
                "sơn trà",
                "ngũ hành sơn",
                "thanh khê",
                "liên chiểu",
                "cẩm lệ",
                "an hải",
                "mỹ khê",
                "hòa khánh",
                "hòa xuân"
        );

        for (String location : locations) {
            if (message.contains(location)) {
                return location;
            }
        }

        return null;
    }

    private ChatbotSuggestionDTO toSuggestion(ChiTietCanHo ct) {
        BaiDang bd = ct.getBaiDang();

        return ChatbotSuggestionDTO.builder()
                .maBaiDang(bd != null ? bd.getMaBaiDang() : null)
                .tieuDe(bd != null ? bd.getTieuDe() : "Căn hộ cho thuê")
                .gia(ct.getGia())
                .phuong(ct.getPhuong())
                .diaChi(ct.getDiaChiCuThe())
                .link(bd != null ? "/posts/" + bd.getMaBaiDang() : null)
                .build();
    }
}