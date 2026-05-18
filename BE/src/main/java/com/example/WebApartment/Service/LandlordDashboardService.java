package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.LandlordDashboardDTO;
import com.example.WebApartment.DTO.LandlordPostStatsDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LandlordDashboardService {

    private final BaiDangRepository baiDangRepository;
    private final HoaDonRepository hoaDonRepository;
    private final ChiTietCanHoRepository chiTietCanHoRepository;

    // Nếu có bảng yêu thích thì inject thêm repository đó
    // private final BaiDangYeuThichRepository baiDangYeuThichRepository;

    public LandlordDashboardDTO getStats(String maNguoiDung) {
        List<BaiDang> posts =
                baiDangRepository.findByNguoiDung_MaNguoiDung(maNguoiDung);

        List<HoaDon> successRentInvoices =
                hoaDonRepository
                        .findByBaiDang_NguoiDung_MaNguoiDungAndLoaiHoaDonAndTrangThaiThanhToan(
                                maNguoiDung,
                                "THUE_CAN_HO",
                                "SUCCESS"
                        );

        Double totalRevenue = successRentInvoices.stream()
                .map(HoaDon::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);

        Long totalViews = posts.stream()
                .map(BaiDang::getLuotXem)
                .filter(Objects::nonNull)
                .reduce(0L, Long::sum);

        // Tạm thời nếu chưa có bảng yêu thích thì để 0
        Long totalLikes = 0L;

        List<LandlordPostStatsDTO> postStats = posts.stream()
                .map(this::toPostStats)
                .toList();

        return LandlordDashboardDTO.builder()
                .totalRevenue(totalRevenue)
                .totalPosts((long) posts.size())
                .activePosts(
                        baiDangRepository
                                .countByNguoiDung_MaNguoiDungAndTrangThaiIgnoreCase(
                                        maNguoiDung,
                                        "ACTIVE"
                                )
                )
                .rentedPosts(
                        baiDangRepository
                                .countByNguoiDung_MaNguoiDungAndTrangThaiIgnoreCase(
                                        maNguoiDung,
                                        "DA_THUE"
                                )
                )
                .totalViews(totalViews)
                .totalLikes(totalLikes)
                .posts(postStats)
                .build();
    }

    private LandlordPostStatsDTO toPostStats(BaiDang baiDang) {
        ChiTietCanHo chiTiet = chiTietCanHoRepository
                .findByBaiDang_MaBaiDang(baiDang.getMaBaiDang())
                .orElse(null);

        List<HoaDon> invoices =
                hoaDonRepository
                        .findByBaiDang_MaBaiDangAndLoaiHoaDonAndTrangThaiThanhToan(
                                baiDang.getMaBaiDang(),
                                "THUE_CAN_HO",
                                "SUCCESS"
                        );

        Double revenue = invoices.stream()
                .map(HoaDon::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);

        Long viewCount = baiDang.getLuotXem() == null
                ? 0L
                : baiDang.getLuotXem();

        Long likeCount = 0L;

        return LandlordPostStatsDTO.builder()
                .maBaiDang(baiDang.getMaBaiDang())
                .tieuDe(baiDang.getTieuDe())
                .trangThai(baiDang.getTrangThai())
                .gia(chiTiet != null ? chiTiet.getGia() : null)
                .viewCount(viewCount)
                .likeCount(likeCount)
                .revenue(revenue)
                .build();
    }
}