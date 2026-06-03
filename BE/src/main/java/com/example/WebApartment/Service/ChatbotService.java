package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final int SEARCH_RESULT_LIMIT = 5;
    private static final int RAG_CONTEXT_LIMIT = 12;
    private static final int MARKET_CONTEXT_LIMIT = 8;

    private final ChiTietCanHoRepository chiTietCanHoRepository;
    private final AiMarketPriceService aiMarketPriceService;

    public ChatbotResponseDTO ask(ChatbotRequestDTO request) {
        String originalMessage = request.getMessage() == null
                ? ""
                : request.getMessage().trim();
        String message = originalMessage.toLowerCase(Locale.ROOT);

        if (!isRealEstateRelated(message)) {
            return ChatbotResponseDTO.builder()
                    .intent("OUT_OF_SCOPE")
                    .answer("Mình chỉ hỗ trợ tư vấn thuê căn hộ, tìm phòng, gợi ý bài đăng và tư vấn giá cho thuê. Bạn có thể hỏi ví dụ: “Tầm 5 triệu ở Hải Châu có căn nào không?”")
                    .suggestions(List.of())
                    .build();
        }

        if (isPriceAdviceIntent(message)) {
            return adviseMarketPrice(originalMessage, message);
        }

        return searchApartments(originalMessage, message);
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

    private ChatbotResponseDTO searchApartments(String originalMessage, String message) {
        Double maxPrice = extractPrice(message);
        Double area = extractArea(message);
        String phuong = extractLocation(message);

        List<ChiTietCanHo> results = chiTietCanHoRepository.searchActiveForChatbot(
                maxPrice,
                normalizeSearchText(phuong),
                PageRequest.of(0, RAG_CONTEXT_LIMIT)
        );

        List<ChiTietCanHo> rankedResults = rankApartmentResults(results, maxPrice, area, phuong)
                .stream()
                .limit(SEARCH_RESULT_LIMIT)
                .toList();

        List<ChatbotSuggestionDTO> suggestions = rankedResults.stream()
                .map(this::toSuggestion)
                .toList();

        String answer;

        if (suggestions.isEmpty()) {
            answer = "Mình chưa tìm thấy căn hộ phù hợp với yêu cầu này. Bạn có thể thử khoảng giá hoặc khu vực khác nhé.";
        } else {
            answer = "Mình tìm thấy một số căn hộ phù hợp với nhu cầu của bạn:";
            String aiAnswer = aiMarketPriceService.answerApartmentSearch(
                    originalMessage,
                    buildApartmentContext(rankedResults)
            );

            if (!aiAnswer.isBlank()) {
                answer = aiAnswer;
            }
        }

        return ChatbotResponseDTO.builder()
                .intent("SEARCH_APARTMENT")
                .answer(answer)
                .suggestions(suggestions)
                .build();
    }

    private ChatbotResponseDTO adviseMarketPrice(String originalMessage, String message) {
        String phuong = extractLocation(message);
        List<ChiTietCanHo> marketContext = chiTietCanHoRepository.searchActiveForChatbot(
                null,
                normalizeSearchText(phuong),
                PageRequest.of(0, MARKET_CONTEXT_LIMIT)
        );

        String answer = aiMarketPriceService.advisePrice(
                originalMessage,
                buildApartmentContext(marketContext)
        );

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

    private String normalizeSearchText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private List<ChiTietCanHo> rankApartmentResults(
            List<ChiTietCanHo> results,
            Double maxPrice,
            Double area,
            String phuong
    ) {
        return results.stream()
                .filter(ct -> ct.getBaiDang() != null)
                .sorted(Comparator.comparingDouble(
                        ct -> calculateMatchPenalty(ct, maxPrice, area, phuong)
                ))
                .toList();
    }

    private double calculateMatchPenalty(
            ChiTietCanHo ct,
            Double maxPrice,
            Double area,
            String phuong
    ) {
        double penalty = 0;

        if (maxPrice != null) {
            penalty += ct.getGia() == null
                    ? 10_000
                    : Math.abs(maxPrice - ct.getGia()) / 100_000;
        }

        if (area != null) {
            penalty += ct.getDienTich() == null
                    ? 1_000
                    : Math.abs(area - ct.getDienTich()) * 10;
        }

        if (phuong != null && (ct.getPhuong() == null ||
                !ct.getPhuong().toLowerCase(Locale.ROOT).contains(phuong))) {
            penalty += 1_000;
        }

        return penalty;
    }

    private String buildApartmentContext(List<ChiTietCanHo> apartments) {
        if (apartments == null || apartments.isEmpty()) {
            return "Không có căn hộ nội bộ phù hợp.";
        }

        StringBuilder context = new StringBuilder();
        int index = 1;

        for (ChiTietCanHo ct : apartments) {
            BaiDang bd = ct.getBaiDang();

            context.append(index++).append(". ")
                    .append("maBaiDang=").append(bd != null ? safeText(bd.getMaBaiDang()) : "N/A")
                    .append("; tieuDe=").append(bd != null ? safeText(bd.getTieuDe()) : "Căn hộ cho thuê")
                    .append("; gia=").append(formatPrice(ct.getGia()))
                    .append("; dienTich=").append(ct.getDienTich() != null ? ct.getDienTich() + " m2" : "chưa có")
                    .append("; phongNgu=").append(ct.getPhongNgu() != null ? ct.getPhongNgu() : "chưa có")
                    .append("; phuong=").append(safeText(ct.getPhuong()))
                    .append("; diaChi=").append(safeText(ct.getDiaChiCuThe()))
                    .append("; soLuongTrong=").append(ct.getSoLuongTrong() != null ? ct.getSoLuongTrong() : "chưa có")
                    .append("; link=").append(bd != null ? "/posts/" + bd.getMaBaiDang() : "chưa có")
                    .append(System.lineSeparator());
        }

        return context.toString();
    }

    private String formatPrice(Double price) {
        if (price == null) {
            return "Liên hệ";
        }

        return String.format(Locale.US, "%.0f VND/tháng", price);
    }

    private String safeText(String value) {
        if (value == null || value.isBlank()) {
            return "chưa có";
        }

        return value.trim().replace(System.lineSeparator(), " ");
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
