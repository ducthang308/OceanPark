package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final int SEARCH_RESULT_LIMIT = 5;
    private static final int RAG_CONTEXT_LIMIT = 80;
    private static final int MARKET_CONTEXT_LIMIT = 40;
    private static final Pattern POST_ID_PATTERN = Pattern.compile("\\bBD\\d+\\b", Pattern.CASE_INSENSITIVE);

    private static final List<LocationAlias> LOCATION_ALIASES = List.of(
            new LocationAlias("Hải Châu", List.of(
                    "hải châu", "hai chau", "hải châu 1", "hải châu 2", "thạch thang",
                    "thanh bình", "thuận phước", "bình hiên", "bình thuận", "hòa thuận",
                    "nam dương", "phước ninh", "hòa cường", "chính gián", "tân chính"
            )),
            new LocationAlias("Sơn Trà", List.of(
                    "sơn trà", "son tra", "an hải", "an hải bắc", "an hải đông", "an hải tây",
                    "phước mỹ", "mỹ khê", "nại hiên đông", "mân thái", "thọ quang"
            )),
            new LocationAlias("Ngũ Hành Sơn", List.of(
                    "ngũ hành sơn", "ngu hanh son", "mỹ an", "khuê mỹ", "hòa hải", "non nước"
            )),
            new LocationAlias("Thanh Khê", List.of(
                    "thanh khê", "thanh khe", "xuân hà", "tam thuận", "chính gián",
                    "tân chính", "thạc gián", "vĩnh trung", "an khê", "hòa khê"
            )),
            new LocationAlias("Liên Chiểu", List.of(
                    "liên chiểu", "lien chieu", "hòa minh", "hòa khánh", "hòa hiệp"
            )),
            new LocationAlias("Cẩm Lệ", List.of(
                    "cẩm lệ", "cam le", "khuê trung", "hòa xuân", "hòa thọ", "cẩm nam"
            )),
            new LocationAlias("Hòa Vang", List.of("hòa vang", "hoa vang"))
    );

    private final ChiTietCanHoRepository chiTietCanHoRepository;
    private final AiMarketPriceService aiMarketPriceService;

    public ChatbotResponseDTO ask(ChatbotRequestDTO request) {
        String originalMessage = request == null || request.getMessage() == null
                ? ""
                : request.getMessage().trim();
        String message = normalizeForMatch(originalMessage);

        if (message.isBlank()) {
            return ChatbotResponseDTO.builder()
                    .intent("EMPTY")
                    .answer("Bạn nhập nhu cầu thuê căn hộ giúp mình nhé, ví dụ: tầm 5 triệu ở Hải Châu, 1 phòng ngủ.")
                    .suggestions(List.of())
                    .build();
        }

        if (!isRealEstateRelated(message) && !isContextualFollowUp(message, request)) {
            return ChatbotResponseDTO.builder()
                    .intent("OUT_OF_SCOPE")
                    .answer("Mình hỗ trợ tìm căn hộ, gợi ý bài đăng và tư vấn giá cho thuê trong hệ thống. Bạn có thể hỏi như: tầm 5 triệu ở Hải Châu có căn nào không?")
                    .suggestions(List.of())
                    .build();
        }

        if (isPriceAdviceIntent(message)) {
            return adviseMarketPrice(originalMessage, message, request);
        }

        return searchApartments(originalMessage, message, request);
    }

    private boolean isRealEstateRelated(String message) {
        if (POST_ID_PATTERN.matcher(message).find()) {
            return true;
        }

        List<String> keywords = List.of(
                "can ho", "phong", "phong tro", "nha", "chung cu", "studio",
                "thue", "cho thue", "gia", "dien tich", "m2", "m²", "pn",
                "ban cong", "noi that", "view", "gan", "dia chi", "lien he",
                "huong", "dong", "tay", "nam", "bac", "re nhat", "dat nhat",
                "hai chau", "son tra", "ngu hanh son", "thanh khe", "lien chieu",
                "cam le", "da nang", "an hai", "my khe", "hoa khanh", "hoa xuan",
                "liet ke", "danh sach", "tim", "co can nao", "con trong"
        );

        return keywords.stream().anyMatch(message::contains);
    }

    private ChatbotResponseDTO searchApartments(
            String originalMessage,
            String message,
            ChatbotRequestDTO request
    ) {
        SearchCriteria currentCriteria = extractSearchCriteria(originalMessage);
        SearchCriteria historyCriteria = extractSearchCriteria(buildRecentUserMessageContext(request));
        SearchCriteria criteria = currentCriteria.withFallback(historyCriteria);
        List<String> requestedPostIds = extractPostIds(originalMessage);
        List<String> previousPostIds = extractRecentSuggestionPostIds(request);
        boolean wantsMoreResults = isAskForMoreResults(message);

        List<ChiTietCanHo> results;

        if (!requestedPostIds.isEmpty()) {
            results = findApartmentsByPreviousSuggestions(requestedPostIds);
        } else if (shouldReusePreviousSuggestions(message, currentCriteria, previousPostIds)) {
            results = findApartmentsByPreviousSuggestions(previousPostIds);
        } else {
            results = searchApartmentsFromDatabase(criteria, RAG_CONTEXT_LIMIT);
        }

        List<ChiTietCanHo> rankedResults = rankApartmentResults(results, criteria);

        if (rankedResults.isEmpty() && requestedPostIds.isEmpty() && criteria.hasAnyFilter()) {
            rankedResults = rankApartmentResults(findBroadActiveApartments(RAG_CONTEXT_LIMIT), criteria);
        }

        if (wantsMoreResults && !previousPostIds.isEmpty()) {
            Set<String> previousIds = new HashSet<>(previousPostIds);
            List<ChiTietCanHo> withoutPrevious = rankedResults.stream()
                    .filter(ct -> ct.getBaiDang() != null)
                    .filter(ct -> !previousIds.contains(ct.getBaiDang().getMaBaiDang()))
                    .toList();

            if (!withoutPrevious.isEmpty()) {
                rankedResults = withoutPrevious;
            }
        }

        List<ChiTietCanHo> selectedResults = rankedResults.stream()
                .limit(SEARCH_RESULT_LIMIT)
                .toList();

        List<ChatbotSuggestionDTO> suggestions = selectedResults.stream()
                .map(this::toSuggestion)
                .toList();

        String answer;

        if (suggestions.isEmpty()) {
            answer = buildNoResultAnswer(criteria);
        } else {
            answer = buildDefaultSearchAnswer(criteria, suggestions);

            String aiAnswer = aiMarketPriceService.answerApartmentSearch(
                    originalMessage,
                    buildApartmentContext(selectedResults)
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

    private ChatbotResponseDTO adviseMarketPrice(
            String originalMessage,
            String message,
            ChatbotRequestDTO request
    ) {
        SearchCriteria currentCriteria = extractSearchCriteria(originalMessage);
        SearchCriteria historyCriteria = extractSearchCriteria(buildRecentUserMessageContext(request));
        SearchCriteria criteria = currentCriteria.withFallback(historyCriteria);
        List<String> previousPostIds = extractRecentSuggestionPostIds(request);

        List<ChiTietCanHo> marketContext = shouldReusePreviousSuggestions(message, currentCriteria, previousPostIds)
                ? findApartmentsByPreviousSuggestions(previousPostIds)
                : searchApartmentsFromDatabase(criteria.withoutPriceCap(), MARKET_CONTEXT_LIMIT);

        if (marketContext.isEmpty()) {
            marketContext = findBroadActiveApartments(MARKET_CONTEXT_LIMIT);
        }

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
        List<String> strongAdvicePhrases = List.of(
                "nen cho thue", "dinh gia", "gia thi truong", "tu van gia",
                "gia nay", "gia do", "gia hop ly", "hop ly khong",
                "cho thue bao nhieu", "nen de gia", "nen dang gia",
                "dang gia bao nhieu", "gia de xuat", "chu nha"
        );

        boolean asksAdvice = strongAdvicePhrases.stream().anyMatch(message::contains);
        boolean asksToFindApartment = List.of(
                "tim", "liet ke", "danh sach", "co can", "co phong", "can nao",
                "phong nao", "duoi", "tren", "tu ", "den ", "tam ", "khoang "
        ).stream().anyMatch(message::contains);

        return asksAdvice && !asksToFindApartment;
    }

    private List<ChiTietCanHo> searchApartmentsFromDatabase(SearchCriteria criteria, int limit) {
        SearchCriteria safeCriteria = criteria == null ? SearchCriteria.empty() : criteria;
        List<ChiTietCanHo> results = chiTietCanHoRepository.searchActiveForChatbot(
                normalizeSearchText(safeCriteria.category()),
                safeCriteria.minPrice(),
                safeCriteria.maxPrice(),
                safeCriteria.minArea(),
                safeCriteria.maxArea(),
                safeCriteria.bedrooms(),
                normalizeSearchText(safeCriteria.phuong()),
                safeCriteria.huong() == null ? null : toOrientationLabel(safeCriteria.huong()),
                normalizeSearchText(safeCriteria.keyword()),
                PageRequest.of(0, limit)
        );

        if (results.isEmpty() && safeCriteria.hasAnyFilter()) {
            return findBroadActiveApartments(limit);
        }

        return results;
    }

    private List<ChiTietCanHo> findBroadActiveApartments(int limit) {
        return chiTietCanHoRepository.searchActiveForChatbot(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                PageRequest.of(0, limit)
        );
    }

    private PriceRange extractPriceRange(String message) {
        String normalizedMessage = normalizeForMatch(message);
        Matcher rangeMatcher = Pattern
                .compile("(?:tu\\s+)?(\\d+(?:[\\.,]\\d+)?)\\s*(?:den|toi|-|–)\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(trieu|tr|k|nghin|ngan)")
                .matcher(normalizedMessage);

        if (rangeMatcher.find()) {
            double low = parseMoney(rangeMatcher.group(1), rangeMatcher.group(3));
            double high = parseMoney(rangeMatcher.group(2), rangeMatcher.group(3));
            return new PriceRange(Math.min(low, high), Math.max(low, high));
        }

        List<Double> prices = new ArrayList<>();
        Matcher matcher = Pattern
                .compile("(\\d+(?:[\\.,]\\d+)?)\\s*(trieu|tr|k|nghin|ngan|vnd|dong|d)\\b")
                .matcher(normalizedMessage);

        while (matcher.find()) {
            prices.add(parseMoney(matcher.group(1), matcher.group(2)));
        }

        Matcher rawMoneyMatcher = Pattern.compile("\\b(\\d{6,})\\b").matcher(normalizedMessage);
        while (rawMoneyMatcher.find()) {
            prices.add(Double.parseDouble(rawMoneyMatcher.group(1)));
        }

        if (prices.isEmpty()) {
            return PriceRange.empty();
        }

        if (prices.size() >= 2) {
            double low = Collections.min(prices);
            double high = Collections.max(prices);
            return new PriceRange(low, high);
        }

        double price = prices.get(0);
        boolean minOnly = List.of("tren", "hon", "tu ", "toi thieu", "it nhat")
                .stream()
                .anyMatch(normalizedMessage::contains);
        boolean maxOnly = List.of("duoi", "khong qua", "toi da", "nho hon", "re hon")
                .stream()
                .anyMatch(normalizedMessage::contains);

        if (minOnly && !maxOnly) {
            return new PriceRange(price, null);
        }

        return new PriceRange(null, price);
    }

    private double parseMoney(String numberText, String unit) {
        double number = Double.parseDouble(numberText.replace(",", "."));
        String normalizedUnit = normalizeForMatch(unit);

        if (normalizedUnit.contains("trieu") || normalizedUnit.equals("tr")) {
            return number * 1_000_000;
        }

        if (normalizedUnit.contains("k") || normalizedUnit.contains("nghin") || normalizedUnit.contains("ngan")) {
            return number * 1_000;
        }

        return number;
    }

    private AreaRange extractAreaRange(String message) {
        String normalizedMessage = normalizeForMatch(message);
        Matcher rangeMatcher = Pattern
                .compile("(?:tu\\s+)?(\\d+(?:[\\.,]\\d+)?)\\s*(?:den|toi|-|–)\\s*(\\d+(?:[\\.,]\\d+)?)\\s*(m2|m²)")
                .matcher(normalizedMessage);

        if (rangeMatcher.find()) {
            float low = parseFloat(rangeMatcher.group(1));
            float high = parseFloat(rangeMatcher.group(2));
            return new AreaRange(Math.min(low, high), Math.max(low, high), null);
        }

        Matcher matcher = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(m2|m²)").matcher(normalizedMessage);

        if (!matcher.find()) {
            return AreaRange.empty();
        }

        float area = parseFloat(matcher.group(1));
        boolean minOnly = List.of("tren", "hon", "tu ", "toi thieu", "it nhat")
                .stream()
                .anyMatch(normalizedMessage::contains);
        boolean maxOnly = List.of("duoi", "khong qua", "toi da", "nho hon")
                .stream()
                .anyMatch(normalizedMessage::contains);

        if (minOnly && !maxOnly) {
            return new AreaRange(area, null, area);
        }

        if (maxOnly) {
            return new AreaRange(null, area, area);
        }

        return new AreaRange(area * 0.8F, area * 1.2F, area);
    }

    private float parseFloat(String numberText) {
        return Float.parseFloat(numberText.replace(",", "."));
    }

    private Integer extractBedrooms(String message) {
        String normalizedMessage = normalizeForMatch(message);
        Matcher matcher = Pattern.compile("(\\d+)\\s*(phong ngu|pn|bedroom)").matcher(normalizedMessage);

        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }

        return null;
    }

    private String extractLocation(String message) {
        String normalizedMessage = normalizeForMatch(message);

        for (LocationAlias location : LOCATION_ALIASES) {
            if (location.matches(normalizedMessage, this::normalizeForMatch)) {
                return location.value();
            }
        }

        return null;
    }

    private String extractCategory(String message) {
        String normalizedMessage = normalizeForMatch(message);

        if (normalizedMessage.contains("phong tro")) {
            return "Phòng trọ";
        }

        if (normalizedMessage.contains("mat bang")) {
            return "Mặt bằng";
        }

        if (normalizedMessage.contains("nha nguyen can")
                || normalizedMessage.contains("nha cho thue")
                || normalizedMessage.contains("nha rieng")) {
            return "Nhà";
        }

        if (normalizedMessage.contains("studio")) {
            return "Studio";
        }

        if (normalizedMessage.contains("chung cu")) {
            return "Chung cư";
        }

        if (normalizedMessage.contains("can ho") || normalizedMessage.contains("apartment")) {
            return "Căn hộ";
        }

        return null;
    }

    private String extractOrientation(String message) {
        String normalizedMessage = normalizeForMatch(message);
        List<String> orientations = List.of(
                "dong nam",
                "tay nam",
                "dong bac",
                "tay bac",
                "nam",
                "bac",
                "dong",
                "tay"
        );

        for (String orientation : orientations) {
            if (normalizedMessage.contains("huong " + orientation)) {
                return orientation;
            }
        }

        return null;
    }

    private String extractKeyword(String message, String phuong, String huong) {
        String normalizedMessage = normalizeForMatch(message);
        List<String> featureKeywords = List.of(
                "full noi that", "noi that", "ban cong", "view bien", "gan bien", "bien",
                "trung tam", "song han", "cau rong", "san bay", "dai hoc", "thang may",
                "may lanh", "may giat", "tu lanh", "nha xe", "cho dau xe", "gac lung",
                "thu cung", "pet"
        );

        for (String keyword : featureKeywords) {
            if (normalizedMessage.contains(keyword)) {
                return keyword.replace("gan ", "");
            }
        }

        Matcher nearMatcher = Pattern.compile("\\b(?:gan|canh|sat)\\s+([a-z0-9\\s]{3,35})").matcher(normalizedMessage);

        if (nearMatcher.find()) {
            String keyword = cleanupKeyword(nearMatcher.group(1), phuong, huong);
            return keyword.isBlank() ? null : keyword;
        }

        return null;
    }

    private String cleanupKeyword(String value, String phuong, String huong) {
        String keyword = normalizeForMatch(value)
                .replaceAll("\\b(can ho|phong|phong tro|nha|chung cu|thue|gia|duoi|tren|tam|khoang|trieu|m2|pn)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();

        if (phuong != null) {
            keyword = keyword.replace(normalizeForMatch(phuong), "").trim();
        }

        if (huong != null) {
            keyword = keyword.replace(huong, "").trim();
        }

        return keyword;
    }

    private ResultSort extractSort(String message) {
        String normalizedMessage = normalizeForMatch(message);

        if (List.of("re nhat", "gia thap", "thap nhat", "gia re").stream().anyMatch(normalizedMessage::contains)) {
            return ResultSort.PRICE_ASC;
        }

        if (List.of("dat nhat", "cao nhat", "gia cao").stream().anyMatch(normalizedMessage::contains)) {
            return ResultSort.PRICE_DESC;
        }

        return null;
    }

    private SearchCriteria extractSearchCriteria(String message) {
        String safeMessage = message == null ? "" : message;
        PriceRange priceRange = extractPriceRange(safeMessage);
        AreaRange areaRange = extractAreaRange(safeMessage);
        String phuong = extractLocation(safeMessage);
        String huong = extractOrientation(safeMessage);
        String category = extractCategory(safeMessage);

        return new SearchCriteria(
                category,
                priceRange.minPrice(),
                priceRange.maxPrice(),
                areaRange.minArea(),
                areaRange.maxArea(),
                areaRange.targetArea(),
                extractBedrooms(safeMessage),
                phuong,
                huong,
                extractKeyword(safeMessage, phuong, huong),
                extractSort(safeMessage)
        );
    }

    private String normalizeSearchText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private List<ChiTietCanHo> rankApartmentResults(
            List<ChiTietCanHo> results,
            SearchCriteria criteria
    ) {
        SearchCriteria safeCriteria = criteria == null ? SearchCriteria.empty() : criteria;
        Comparator<ChiTietCanHo> comparator = buildResultComparator(safeCriteria);

        return results.stream()
                .filter(ct -> ct.getBaiDang() != null)
                .filter(ct -> matchesHardCriteria(ct, safeCriteria))
                .sorted(comparator)
                .toList();
    }

    private Comparator<ChiTietCanHo> buildResultComparator(SearchCriteria criteria) {
        ResultSort sort = criteria.effectiveSort();

        if (sort == ResultSort.PRICE_ASC) {
            return Comparator
                    .comparing(ChiTietCanHo::getGia, Comparator.nullsLast(Double::compareTo))
                    .thenComparingDouble(ct -> calculateMatchPenalty(ct, criteria))
                    .thenComparing(this::getNgayTaoSafe, Comparator.reverseOrder());
        }

        if (sort == ResultSort.PRICE_DESC) {
            return Comparator
                    .comparing(ChiTietCanHo::getGia, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparingDouble(ct -> calculateMatchPenalty(ct, criteria))
                    .thenComparing(this::getNgayTaoSafe, Comparator.reverseOrder());
        }

        return Comparator
                .comparingDouble((ChiTietCanHo ct) -> calculateMatchPenalty(ct, criteria))
                .thenComparing(this::getNgayTaoSafe, Comparator.reverseOrder());
    }

    private LocalDateTime getNgayTaoSafe(ChiTietCanHo ct) {
        return ct.getNgayTao() == null ? LocalDateTime.MIN : ct.getNgayTao();
    }

    private boolean matchesHardCriteria(ChiTietCanHo ct, SearchCriteria criteria) {
        if (criteria.category() != null && !matchesCategory(ct, criteria.category())) {
            return false;
        }

        if (criteria.minPrice() != null && (ct.getGia() == null || ct.getGia() < criteria.minPrice())) {
            return false;
        }

        if (criteria.maxPrice() != null && (ct.getGia() == null || ct.getGia() > criteria.maxPrice())) {
            return false;
        }

        if (criteria.minArea() != null && (ct.getDienTich() == null || ct.getDienTich() < criteria.minArea())) {
            return false;
        }

        if (criteria.maxArea() != null && (ct.getDienTich() == null || ct.getDienTich() > criteria.maxArea())) {
            return false;
        }

        if (criteria.bedrooms() != null && !criteria.bedrooms().equals(ct.getPhongNgu())) {
            return false;
        }

        if (criteria.phuong() != null && !matchesLocation(ct, criteria.phuong())) {
            return false;
        }

        if (criteria.huong() != null && !matchesOrientation(ct, criteria.huong())) {
            return false;
        }

        return criteria.keyword() == null || matchesKeyword(ct, criteria.keyword());
    }

    private boolean matchesCategory(ChiTietCanHo ct, String category) {
        BaiDang bd = ct.getBaiDang();

        if (bd == null || bd.getDanhMuc() == null) {
            return false;
        }

        String categoryText = normalizeForMatch(String.join(" ",
                safeText(bd.getDanhMuc().getMaDanhMuc()),
                safeText(bd.getDanhMuc().getTenDanhMuc())
        ));
        String requestedCategory = normalizeForMatch(category);

        if ("can ho".equals(requestedCategory)) {
            return categoryText.contains("can ho");
        }

        if ("nha".equals(requestedCategory)) {
            return categoryText.contains("nha");
        }

        return categoryText.contains(requestedCategory);
    }

    private boolean matchesLocation(ChiTietCanHo ct, String location) {
        String haystack = normalizeForMatch(buildSearchableApartmentText(ct));
        List<String> terms = expandLocationTerms(location);

        return terms.stream()
                .map(this::normalizeForMatch)
                .anyMatch(haystack::contains);
    }

    private List<String> expandLocationTerms(String location) {
        String normalizedLocation = normalizeForMatch(location);

        for (LocationAlias alias : LOCATION_ALIASES) {
            if (normalizeForMatch(alias.value()).equals(normalizedLocation)) {
                return alias.aliases();
            }
        }

        return List.of(location);
    }

    private boolean matchesKeyword(ChiTietCanHo ct, String keyword) {
        String haystack = normalizeForMatch(buildSearchableApartmentText(ct));
        return haystack.contains(normalizeForMatch(keyword));
    }

    private String buildSearchableApartmentText(ChiTietCanHo ct) {
        BaiDang bd = ct.getBaiDang();

        return String.join(" ",
                safeText(bd != null ? bd.getTieuDe() : null),
                safeText(bd != null ? bd.getNoiDung() : null),
                safeText(bd != null && bd.getDanhMuc() != null ? bd.getDanhMuc().getTenDanhMuc() : null),
                safeText(ct.getPhuong()),
                safeText(ct.getDiaChiCuThe()),
                safeText(ct.getHuongCanHo())
        );
    }

    private boolean shouldReusePreviousSuggestions(
            String message,
            SearchCriteria currentCriteria,
            List<String> previousPostIds
    ) {
        return !currentCriteria.hasAnySearchSignal()
                && !isAskForMoreResults(message)
                && previousPostIds != null
                && !previousPostIds.isEmpty();
    }

    private List<ChiTietCanHo> findApartmentsByPreviousSuggestions(List<String> previousPostIds) {
        if (previousPostIds == null || previousPostIds.isEmpty()) {
            return List.of();
        }

        List<ChiTietCanHo> apartments = chiTietCanHoRepository.findActiveByBaiDangIds(previousPostIds);
        Map<String, ChiTietCanHo> apartmentByPostId = new HashMap<>();

        for (ChiTietCanHo apartment : apartments) {
            if (apartment.getBaiDang() != null && apartment.getBaiDang().getMaBaiDang() != null) {
                apartmentByPostId.put(apartment.getBaiDang().getMaBaiDang(), apartment);
            }
        }

        return previousPostIds.stream()
                .map(apartmentByPostId::get)
                .filter(Objects::nonNull)
                .toList();
    }

    private boolean isContextualFollowUp(String message, ChatbotRequestDTO request) {
        if (!hasConversationContext(request)) {
            return false;
        }

        return isDetailFollowUpQuestion(message) || isAskForMoreResults(message);
    }

    private boolean isDetailFollowUpQuestion(String message) {
        List<String> followUpKeywords = List.of(
                "dia chi",
                "o dau",
                "chi tiet",
                "gia",
                "dien tich",
                "phong ngu",
                "lien he",
                "con trong",
                "can nay",
                "can do",
                "nhung can nay",
                "cac can nay"
        );

        return followUpKeywords.stream().anyMatch(message::contains);
    }

    private boolean isAskForMoreResults(String message) {
        List<String> moreKeywords = List.of("can khac", "phong khac", "khac nua", "xem them", "them can", "con nua");
        return moreKeywords.stream().anyMatch(message::contains);
    }

    private boolean hasConversationContext(ChatbotRequestDTO request) {
        return !extractRecentSuggestionPostIds(request).isEmpty() ||
                !buildRecentUserMessageContext(request).isBlank();
    }

    private String buildRecentUserMessageContext(ChatbotRequestDTO request) {
        if (request == null || request.getHistory() == null || request.getHistory().isEmpty()) {
            return "";
        }

        List<ChatbotMessageContextDTO> history = request.getHistory();
        int start = Math.max(0, history.size() - 8);
        StringBuilder context = new StringBuilder();

        for (int i = start; i < history.size(); i++) {
            ChatbotMessageContextDTO item = history.get(i);

            if (item != null &&
                    "USER".equalsIgnoreCase(item.getRole()) &&
                    item.getContent() != null &&
                    !item.getContent().isBlank()) {
                context.append(item.getContent()).append(' ');
            }
        }

        return context.toString().trim();
    }

    private List<String> extractRecentSuggestionPostIds(ChatbotRequestDTO request) {
        if (request == null || request.getHistory() == null || request.getHistory().isEmpty()) {
            return List.of();
        }

        List<ChatbotMessageContextDTO> history = request.getHistory();

        for (int i = history.size() - 1; i >= 0; i--) {
            ChatbotMessageContextDTO item = history.get(i);

            if (item == null || item.getSuggestions() == null || item.getSuggestions().isEmpty()) {
                continue;
            }

            return item.getSuggestions().stream()
                    .map(ChatbotSuggestionDTO::getMaBaiDang)
                    .filter(Objects::nonNull)
                    .filter(id -> !id.isBlank())
                    .distinct()
                    .toList();
        }

        return List.of();
    }

    private List<String> extractPostIds(String message) {
        if (message == null || message.isBlank()) {
            return List.of();
        }

        Matcher matcher = POST_ID_PATTERN.matcher(message);
        List<String> postIds = new ArrayList<>();

        while (matcher.find()) {
            postIds.add(matcher.group().toUpperCase(Locale.ROOT));
        }

        return postIds.stream().distinct().toList();
    }

    private double calculateMatchPenalty(
            ChiTietCanHo ct,
            SearchCriteria criteria
    ) {
        double penalty = 0;

        if (criteria.maxPrice() != null && ct.getGia() != null) {
            penalty += Math.abs(criteria.maxPrice() - ct.getGia()) / 100_000;
        }

        if (criteria.minPrice() != null && ct.getGia() != null) {
            penalty += Math.abs(criteria.minPrice() - ct.getGia()) / 100_000;
        }

        if (criteria.targetArea() != null && ct.getDienTich() != null) {
            penalty += Math.abs(criteria.targetArea() - ct.getDienTich()) * 10;
        }

        if (criteria.bedrooms() != null && !criteria.bedrooms().equals(ct.getPhongNgu())) {
            penalty += 500;
        }

        if (criteria.phuong() != null && !matchesLocation(ct, criteria.phuong())) {
            penalty += 1_000;
        }

        if (criteria.huong() != null && !matchesOrientation(ct, criteria.huong())) {
            penalty += 500;
        }

        if (criteria.keyword() != null && !matchesKeyword(ct, criteria.keyword())) {
            penalty += 500;
        }

        return penalty;
    }

    private boolean matchesOrientation(ChiTietCanHo ct, String huong) {
        return huong != null && huong.equals(canonicalOrientation(ct.getHuongCanHo()));
    }

    private String canonicalOrientation(String value) {
        String normalizedValue = normalizeForMatch(value);
        List<String> orientations = List.of(
                "dong nam",
                "tay nam",
                "dong bac",
                "tay bac",
                "nam",
                "bac",
                "dong",
                "tay"
        );

        for (String orientation : orientations) {
            if (containsOrientation(normalizedValue, orientation)) {
                return orientation;
            }
        }

        return null;
    }

    private boolean containsOrientation(String normalizedValue, String orientation) {
        if (normalizedValue == null || normalizedValue.isBlank()) {
            return false;
        }

        return Pattern.compile("(^|\\s)" + Pattern.quote(orientation) + "(\\s|$)")
                .matcher(normalizedValue)
                .find();
    }

    private String toOrientationLabel(String orientation) {
        if (orientation == null) {
            return "";
        }

        return switch (orientation) {
            case "dong nam" -> "Đông Nam";
            case "tay nam" -> "Tây Nam";
            case "dong bac" -> "Đông Bắc";
            case "tay bac" -> "Tây Bắc";
            case "nam" -> "Nam";
            case "bac" -> "Bắc";
            case "dong" -> "Đông";
            case "tay" -> "Tây";
            default -> orientation;
        };
    }

    private String buildDefaultSearchAnswer(SearchCriteria criteria, List<ChatbotSuggestionDTO> suggestions) {
        List<String> filters = new ArrayList<>();

        if (criteria.category() != null) {
            filters.add("danh mục " + criteria.category());
        }

        if (criteria.maxPrice() != null) {
            filters.add("giá tối đa " + formatPrice(criteria.maxPrice()));
        }

        if (criteria.minPrice() != null) {
            filters.add("giá từ " + formatPrice(criteria.minPrice()));
        }

        if (criteria.phuong() != null) {
            filters.add("khu vực " + criteria.phuong());
        }

        if (criteria.bedrooms() != null) {
            filters.add(criteria.bedrooms() + " phòng ngủ");
        }

        if (criteria.huong() != null) {
            filters.add("hướng " + toOrientationLabel(criteria.huong()));
        }

        if (criteria.keyword() != null) {
            filters.add("liên quan " + criteria.keyword());
        }

        String itemLabel = criteria.category() != null
                ? criteria.category().toLowerCase(Locale.ROOT)
                : "căn hộ";
        String filterText = filters.isEmpty() ? "" : " theo " + String.join(", ", filters);
        return "Mình tìm thấy " + suggestions.size() + " " + itemLabel + " phù hợp" + filterText + ". Bạn xem danh sách bên dưới nhé.";
    }

    private String buildNoResultAnswer(SearchCriteria criteria) {
        if (criteria == null || !criteria.hasAnyFilter()) {
            return "Mình chưa tìm thấy căn hộ đang hiển thị trong hệ thống. Bạn thử lại sau hoặc nhập thêm khu vực, giá và số phòng ngủ nhé.";
        }

        if (criteria.category() != null) {
            return "Mình chưa tìm thấy " + criteria.category().toLowerCase(Locale.ROOT) + " đang còn trống khớp các điều kiện này. Bạn có thể nới khoảng giá, đổi khu vực hoặc bỏ bớt bộ lọc nhé.";
        }

        return "Mình chưa tìm thấy căn hộ đang còn trống khớp các điều kiện này. Bạn có thể nới khoảng giá, đổi khu vực hoặc bỏ bớt bộ lọc nhé.";
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
                    .append("; danhMuc=").append(bd != null && bd.getDanhMuc() != null ? safeText(bd.getDanhMuc().getTenDanhMuc()) : "chưa có")
                    .append("; gia=").append(formatPrice(ct.getGia()))
                    .append("; dienTich=").append(ct.getDienTich() != null ? ct.getDienTich() + " m2" : "chưa có")
                    .append("; phongNgu=").append(ct.getPhongNgu() != null ? ct.getPhongNgu() : "chưa có")
                    .append("; huongCanHo=").append(safeText(ct.getHuongCanHo()))
                    .append("; phuong=").append(safeText(ct.getPhuong()))
                    .append("; diaChi=").append(safeText(ct.getDiaChiCuThe()))
                    .append("; soLuongTrong=").append(ct.getSoLuongTrong() != null ? ct.getSoLuongTrong() : "chưa có")
                    .append("; lienHe=").append(bd != null ? safeText(bd.getLienHe()) : "chưa có")
                    .append("; noiDung=").append(bd != null ? compactText(bd.getNoiDung(), 180) : "chưa có")
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

        return value.trim().replaceAll("[\\r\\n]+", " ");
    }

    private String compactText(String value, int maxLength) {
        String text = safeText(value);

        if (text.length() <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength).trim() + "...";
    }

    private String normalizeForMatch(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .replace("Đ", "D")
                .toLowerCase(Locale.ROOT);
    }

    private ChatbotSuggestionDTO toSuggestion(ChiTietCanHo ct) {
        BaiDang bd = ct.getBaiDang();

        return ChatbotSuggestionDTO.builder()
                .maBaiDang(bd != null ? bd.getMaBaiDang() : null)
                .tieuDe(bd != null ? bd.getTieuDe() : "Căn hộ cho thuê")
                .danhMuc(bd != null && bd.getDanhMuc() != null ? bd.getDanhMuc().getTenDanhMuc() : null)
                .gia(ct.getGia())
                .dienTich(ct.getDienTich())
                .phongNgu(ct.getPhongNgu())
                .huongCanHo(ct.getHuongCanHo())
                .phuong(ct.getPhuong())
                .diaChi(ct.getDiaChiCuThe())
                .soLuongTrong(ct.getSoLuongTrong())
                .link(bd != null ? "/posts/" + bd.getMaBaiDang() : null)
                .build();
    }

    private enum ResultSort {
        PRICE_ASC,
        PRICE_DESC,
        NEWEST
    }

    private record PriceRange(Double minPrice, Double maxPrice) {
        private static PriceRange empty() {
            return new PriceRange(null, null);
        }
    }

    private record AreaRange(Float minArea, Float maxArea, Float targetArea) {
        private static AreaRange empty() {
            return new AreaRange(null, null, null);
        }
    }

    private record LocationAlias(String value, List<String> aliases) {
        private boolean matches(String normalizedMessage, java.util.function.Function<String, String> normalizer) {
            return aliases.stream()
                    .map(normalizer)
                    .anyMatch(normalizedMessage::contains);
        }
    }

    private record SearchCriteria(
            String category,
            Double minPrice,
            Double maxPrice,
            Float minArea,
            Float maxArea,
            Float targetArea,
            Integer bedrooms,
            String phuong,
            String huong,
            String keyword,
            ResultSort sort
    ) {
        private static SearchCriteria empty() {
            return new SearchCriteria(null, null, null, null, null, null, null, null, null, null, null);
        }

        private SearchCriteria withFallback(SearchCriteria fallback) {
            if (fallback == null) {
                return this;
            }

            return new SearchCriteria(
                    category != null ? category : fallback.category,
                    minPrice != null ? minPrice : fallback.minPrice,
                    maxPrice != null ? maxPrice : fallback.maxPrice,
                    minArea != null ? minArea : fallback.minArea,
                    maxArea != null ? maxArea : fallback.maxArea,
                    targetArea != null ? targetArea : fallback.targetArea,
                    bedrooms != null ? bedrooms : fallback.bedrooms,
                    phuong != null ? phuong : fallback.phuong,
                    huong != null ? huong : fallback.huong,
                    keyword != null ? keyword : fallback.keyword,
                    sort != null ? sort : fallback.sort
            );
        }

        private SearchCriteria withoutPriceCap() {
            return new SearchCriteria(
                    category,
                    null,
                    null,
                    minArea,
                    maxArea,
                    targetArea,
                    bedrooms,
                    phuong,
                    huong,
                    keyword,
                    sort
            );
        }

        private boolean hasAnyFilter() {
            return category != null
                    || minPrice != null
                    || maxPrice != null
                    || minArea != null
                    || maxArea != null
                    || bedrooms != null
                    || phuong != null
                    || huong != null
                    || keyword != null;
        }

        private boolean hasAnySearchSignal() {
            return hasAnyFilter() || sort != null;
        }

        private ResultSort effectiveSort() {
            return sort == null ? ResultSort.NEWEST : sort;
        }
    }
}
