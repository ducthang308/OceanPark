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

import java.util.List;

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
        if (Boolean.TRUE.equals(nhuCau.getCoBanCong())) {
            score += 10;
        }

        // ===== Nội thất =====
        if (Boolean.TRUE.equals(nhuCau.getDayDuNoiThat())) {
            score += 10;
        }

        return score;
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
