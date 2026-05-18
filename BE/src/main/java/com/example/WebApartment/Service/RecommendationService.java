package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Models.NhuCauNguoiDung;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import com.example.WebApartment.Repository.LichSuTimKiemRepository;
import com.example.WebApartment.Repository.NhuCauNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final NhuCauNguoiDungRepository nhuCauRepo;
    private final BaiDangRepository baiDangRepo;
    private final ChiTietCanHoRepository chiTietRepo;
    private final LichSuTimKiemRepository lichSuRepo;

    public List<BaiDangDTO> recommend(String maNguoiDung) {

        NhuCauNguoiDung nhuCau = nhuCauRepo
                .findTopByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(maNguoiDung)
                .orElse(null);

        System.out.println("RECOMMEND USER = " + maNguoiDung);
        System.out.println("NHU CAU = " + nhuCau);

        return baiDangRepo.findAll()
                .stream()
                .filter(bd -> "ACTIVE".equalsIgnoreCase(bd.getTrangThai()))
                .filter(bd -> {
                    ChiTietCanHo ct = chiTietRepo
                            .findByBaiDang_MaBaiDang(bd.getMaBaiDang())
                            .orElse(null);

                    return ct != null
                            && matchRequiredPrice(ct, nhuCau)
                            && matchRequiredLocation(ct, nhuCau);
                })
                .sorted((a, b) ->
                        Integer.compare(
                                calculateScore(b, nhuCau),
                                calculateScore(a, nhuCau)
                        )
                )
                .limit(10)
                .map(this::toDto)
                .toList();
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

        String userLocation = nhuCau.getPhuong().trim().toLowerCase();
        String postLocation = ct.getPhuong().trim().toLowerCase();

        return postLocation.contains(userLocation)
                || userLocation.contains(postLocation);
    }
    private int calculateScore(
            BaiDang baiDang,
            NhuCauNguoiDung nhuCau
    ) {

        int score = 0;

        if (nhuCau == null) return score;

        ChiTietCanHo ct = chiTietRepo
                .findByBaiDang_MaBaiDang(baiDang.getMaBaiDang())
                .orElse(null);

        if (ct == null) return score;

        // ===== Giá =====
        if (ct.getGia() != null
                && nhuCau.getMinPrice() != null
                && nhuCau.getMaxPrice() != null) {

            if (ct.getGia() >= nhuCau.getMinPrice()
                    && ct.getGia() <= nhuCau.getMaxPrice()) {
                score += 30;
            }
        }

        // ===== Phường =====
        if (ct.getPhuong() != null
                && nhuCau.getPhuong() != null
                && ct.getPhuong().equalsIgnoreCase(nhuCau.getPhuong())) {

            score += 25;
        }

        // ===== Loại căn hộ =====
        if (nhuCau.getLoaiCanHo() != null
                && baiDang.getDanhMuc() != null
                && baiDang.getDanhMuc().getTenDanhMuc()
                .equalsIgnoreCase(nhuCau.getLoaiCanHo())) {

            score += 25;
        }

        // ===== Ban công =====
        if (Boolean.TRUE.equals(nhuCau.getCoBanCong())
                && containsAny(baiDang, "ban công", "ban cong")) {
            score += 10;
        }

        // ===== Nội thất =====
        if (Boolean.TRUE.equals(nhuCau.getDayDuNoiThat())
                && containsAny(baiDang, "đầy đủ nội thất", "day du noi that", "full nội thất", "full noi that")) {
            score += 10;
        }

        score += calculatePreferenceScore(baiDang, nhuCau);

        return score;
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

    private String normalizeSearchText(String value) {
        String withoutMarks = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutMarks
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
    }

    private BaiDangDTO toDto(BaiDang e) {

        return BaiDangDTO.builder()
                .maBaiDang(e.getMaBaiDang())
                .maNguoiDung(e.getNguoiDung().getMaNguoiDung())
                .maDanhMuc(e.getDanhMuc().getMaDanhMuc())
                .tieuDe(e.getTieuDe())
                .noiDung(e.getNoiDung())
                .trangThai(e.getTrangThai())
                .ngayDang(e.getNgayDang())
                .build();
    }
}
