package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Models.NhuCauNguoiDung;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import com.example.WebApartment.Repository.NhuCauNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final NhuCauNguoiDungRepository nhuCauRepo;
    private final BaiDangRepository baiDangRepo;
    private final ChiTietCanHoRepository chiTietRepo;

    private static final int MAX_RECOMMENDATION_SCORE = 100;

    private record RecommendationCandidate(
            BaiDang baiDang,
            int score,
            List<String> reasons,
            String aiSuggestion
    ) {
    }

    public List<BaiDangDTO> recommend(String maNguoiDung) {

        NhuCauNguoiDung nhuCau = nhuCauRepo
                .findTopByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(maNguoiDung)
                .orElse(null);

        if (nhuCau == null) {
            return List.of();
        }

        return baiDangRepo.findAll()
                .stream()
                .filter(this::isPublicPost)
                .map(baiDang -> buildCandidate(baiDang, nhuCau))
                .filter(candidate -> candidate != null && candidate.score() > 0)
                .sorted((a, b) -> Integer.compare(b.score(), a.score()))
                .limit(10)
                .map(candidate -> toDto(
                        candidate.baiDang(),
                        candidate.score(),
                        candidate.reasons(),
                        candidate.aiSuggestion()
                ))
                .toList();
    }

    private boolean isPublicPost(BaiDang baiDang) {
        if (baiDang == null || baiDang.getTrangThai() == null) return false;

        String status = baiDang.getTrangThai().trim().toUpperCase(Locale.ROOT);
        return "ACTIVE".equals(status) || "APPROVED".equals(status);
    }

    private RecommendationCandidate buildCandidate(BaiDang baiDang, NhuCauNguoiDung nhuCau) {
        ChiTietCanHo chiTiet = chiTietRepo
                .findByBaiDang_MaBaiDang(baiDang.getMaBaiDang())
                .orElse(null);

        if (chiTiet == null
                || !matchRequiredPrice(chiTiet, nhuCau)
                || !matchRequiredLocation(chiTiet, nhuCau)) {
            return null;
        }

        int score = Math.min(
                MAX_RECOMMENDATION_SCORE,
                calculateScore(baiDang, chiTiet, nhuCau)
        );
        List<String> reasons = buildReasons(baiDang, chiTiet, nhuCau);

        return new RecommendationCandidate(
                baiDang,
                score,
                reasons,
                buildAiSuggestion(score, reasons)
        );
    }

    private boolean matchRequiredPrice(ChiTietCanHo ct, NhuCauNguoiDung nhuCau) {
        if (nhuCau == null) return false;

        if (ct == null || ct.getGia() == null) return false;

        if (nhuCau.getMinPrice() != null && ct.getGia() < nhuCau.getMinPrice()) {
            return false;
        }

        if (nhuCau.getMaxPrice() != null && ct.getGia() > nhuCau.getMaxPrice()) {
            return false;
        }

        return true;
    }

    private boolean matchRequiredLocation(ChiTietCanHo ct, NhuCauNguoiDung nhuCau) {
        if (nhuCau == null) return false;

        if (nhuCau.getPhuong() == null || nhuCau.getPhuong().isBlank()) {
            return true;
        }

        if (ct == null || ct.getPhuong() == null) {
            return false;
        }

        String userLocation = normalizeSearchText(nhuCau.getPhuong().trim());
        String postLocation = normalizeSearchText(ct.getPhuong().trim());

        return postLocation.contains(userLocation)
                || userLocation.contains(postLocation);
    }

    private int calculateScore(
            BaiDang baiDang,
            ChiTietCanHo ct,
            NhuCauNguoiDung nhuCau
    ) {

        int score = 0;

        if (nhuCau == null) return score;

        if (ct == null) return score;

        if (matchesPricePreference(ct, nhuCau)) {
            score += 30;
        }

        if (matchesLocationPreference(ct, nhuCau)) {
            score += 25;
        }

        if (matchesCategoryPreference(baiDang, nhuCau)) {
            score += 25;
        }

        if (Boolean.TRUE.equals(nhuCau.getCoBanCong())
                && containsAny(baiDang, "ban công", "ban cong")) {
            score += 10;
        }

        if (Boolean.TRUE.equals(nhuCau.getDayDuNoiThat())
                && containsAny(baiDang, "đầy đủ nội thất", "day du noi that", "full nội thất", "full noi that")) {
            score += 10;
        }

        score += calculatePreferenceScore(baiDang, nhuCau);

        return score;
    }

    private List<String> buildReasons(BaiDang baiDang, ChiTietCanHo chiTiet, NhuCauNguoiDung nhuCau) {
        List<String> reasons = new ArrayList<>();

        if (matchesPricePreference(chiTiet, nhuCau)) {
            reasons.add("Giá nằm trong ngân sách đã chọn");
        }

        if (matchesLocationPreference(chiTiet, nhuCau)) {
            reasons.add("Đúng khu vực " + nhuCau.getPhuong().trim());
        }

        if (matchesCategoryPreference(baiDang, nhuCau)) {
            reasons.add("Đúng loại hình " + nhuCau.getLoaiCanHo().trim());
        }

        addPreferenceReason(reasons, baiDang, nhuCau.getCoBanCong(), "Có ban công", "ban công", "ban cong");
        addPreferenceReason(
                reasons,
                baiDang,
                nhuCau.getDayDuNoiThat(),
                "Đầy đủ nội thất",
                "đầy đủ nội thất",
                "day du noi that",
                "full nội thất",
                "full noi that"
        );
        addPreferenceReason(reasons, baiDang, nhuCau.getCoMayLanh(), "Có máy lạnh", "máy lạnh", "may lanh", "điều hòa", "dieu hoa");
        addPreferenceReason(reasons, baiDang, nhuCau.getCoThangMay(), "Có thang máy", "thang máy", "thang may");
        addPreferenceReason(reasons, baiDang, nhuCau.getCoMayGiat(), "Có máy giặt", "máy giặt", "may giat");
        addPreferenceReason(reasons, baiDang, nhuCau.getCoNhaXe(), "Có chỗ để xe", "hầm xe", "ham xe", "để xe", "de xe", "bãi xe", "bai xe");
        addPreferenceReason(reasons, baiDang, nhuCau.getCoTuLanh(), "Có tủ lạnh", "tủ lạnh", "tu lanh");
        addPreferenceReason(
                reasons,
                baiDang,
                nhuCau.getGioGiacTuDo(),
                "Giờ giấc tự do",
                "giờ giấc tự do",
                "gio giac tu do",
                "tự do giờ giấc",
                "tu do gio giac"
        );
        addPreferenceReason(reasons, baiDang, nhuCau.getGanTrungTam(), "Gần trung tâm", "trung tâm", "trung tam", "hải châu", "hai chau");
        addPreferenceReason(reasons, baiDang, nhuCau.getGanBien(), "Gần biển", "gần biển", "gan bien", "biển", "bien", "mỹ khê", "my khe");

        return reasons.stream().limit(4).toList();
    }

    private void addPreferenceReason(
            List<String> reasons,
            BaiDang baiDang,
            Boolean enabled,
            String reason,
            String... keywords
    ) {
        if (Boolean.TRUE.equals(enabled) && containsAny(baiDang, keywords)) {
            reasons.add(reason);
        }
    }

    private boolean matchesPricePreference(ChiTietCanHo chiTiet, NhuCauNguoiDung nhuCau) {
        return nhuCau != null
                && (nhuCau.getMinPrice() != null || nhuCau.getMaxPrice() != null)
                && matchRequiredPrice(chiTiet, nhuCau);
    }

    private boolean matchesLocationPreference(ChiTietCanHo chiTiet, NhuCauNguoiDung nhuCau) {
        return nhuCau != null
                && hasText(nhuCau.getPhuong())
                && chiTiet != null
                && hasText(chiTiet.getPhuong())
                && (normalizeSearchText(chiTiet.getPhuong()).contains(normalizeSearchText(nhuCau.getPhuong()))
                || normalizeSearchText(nhuCau.getPhuong()).contains(normalizeSearchText(chiTiet.getPhuong())));
    }

    private boolean matchesCategoryPreference(BaiDang baiDang, NhuCauNguoiDung nhuCau) {
        return nhuCau != null
                && hasText(nhuCau.getLoaiCanHo())
                && baiDang != null
                && baiDang.getDanhMuc() != null
                && hasText(baiDang.getDanhMuc().getTenDanhMuc())
                && normalizeSearchText(baiDang.getDanhMuc().getTenDanhMuc())
                .equals(normalizeSearchText(nhuCau.getLoaiCanHo()));
    }

    private int calculatePreferenceScore(BaiDang baiDang, NhuCauNguoiDung nhuCau) {
        int score = 0;

        if (Boolean.TRUE.equals(nhuCau.getCoMayLanh())
                && containsAny(baiDang, "máy lạnh", "may lanh", "điều hòa", "dieu hoa")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getCoThangMay())
                && containsAny(baiDang, "thang máy", "thang may")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getCoMayGiat())
                && containsAny(baiDang, "máy giặt", "may giat")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getCoNhaXe())
                && containsAny(baiDang, "hầm xe", "ham xe", "để xe", "de xe", "bãi xe", "bai xe")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getCoTuLanh())
                && containsAny(baiDang, "tủ lạnh", "tu lanh")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getGioGiacTuDo())
                && containsAny(baiDang, "giờ giấc tự do", "gio giac tu do", "tự do giờ giấc", "tu do gio giac")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getGanTrungTam())
                && containsAny(baiDang, "trung tâm", "trung tam", "hải châu", "hai chau")) {
            score += 5;
        }

        if (Boolean.TRUE.equals(nhuCau.getGanBien())
                && containsAny(baiDang, "gần biển", "gan bien", "biển", "bien", "mỹ khê", "my khe")) {
            score += 5;
        }

        return score;
    }

    private boolean containsAny(BaiDang baiDang, String... keywords) {
        String searchableText = normalizeSearchText(
                (baiDang.getTieuDe() != null ? baiDang.getTieuDe() : "")
                        + " "
                        + (baiDang.getNoiDung() != null ? baiDang.getNoiDung() : "")
        );

        for (String keyword : keywords) {
            if (searchableText.contains(normalizeSearchText(keyword))) {
                return true;
            }
        }

        return false;
    }

    private String buildAiSuggestion(int score, List<String> reasons) {
        String mainReason = reasons.isEmpty()
                ? "đang khớp với nhu cầu đã lưu"
                : reasons.get(0).toLowerCase(Locale.ROOT);

        if (score >= 85) {
            return "AI gợi ý xem ngay vì tin này " + mainReason + ".";
        }

        if (score >= 65) {
            return "AI gợi ý đây là lựa chọn phù hợp tốt để so sánh.";
        }

        if (score >= 40) {
            return "AI gợi ý có thể cân nhắc nếu bạn muốn thêm lựa chọn.";
        }

        return "AI gợi ý mức phù hợp cơ bản với nhu cầu hiện tại.";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeSearchText(String value) {
        String withoutMarks = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutMarks
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
    }

    private BaiDangDTO toDto(
            BaiDang e,
            int recommendationScore,
            List<String> recommendationReasons,
            String aiSuggestion
    ) {

        return BaiDangDTO.builder()
                .maBaiDang(e.getMaBaiDang())
                .maNguoiDung(e.getNguoiDung() != null ? e.getNguoiDung().getMaNguoiDung() : null)
                .maDanhMuc(e.getDanhMuc() != null ? e.getDanhMuc().getMaDanhMuc() : null)
                .tieuDe(e.getTieuDe())
                .noiDung(e.getNoiDung())
                .trangThai(e.getTrangThai())
                .ngayDang(e.getNgayDang())
                .lienHe(e.getLienHe())
                .hinhThucThanhToan(e.getHinhThucThanhToan())
                .luotXem(e.getLuotXem())
                .recommendationScore(recommendationScore)
                .recommendationReasons(recommendationReasons)
                .aiSuggestion(aiSuggestion)
                .build();
    }
}
