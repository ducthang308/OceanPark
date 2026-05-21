package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.LandlordDashboardDTO;
import com.example.WebApartment.DTO.LandlordPostStatsDTO;
import com.example.WebApartment.DTO.LandlordRevenueDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.BaiDangYeuThichRepository;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LandlordDashboardService {

    private final BaiDangRepository baiDangRepository;
    private final HoaDonRepository hoaDonRepository;
    private final ChiTietCanHoRepository chiTietCanHoRepository;
    private final BaiDangYeuThichRepository baiDangYeuThichRepository;

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

        Long totalLikes = baiDangYeuThichRepository
                .countByBaiDang_NguoiDung_MaNguoiDung(maNguoiDung);

        List<LandlordPostStatsDTO> postStats = posts.stream()
                .map(this::toPostStats)
                .toList();

        List<LandlordRevenueDTO> revenues = successRentInvoices.stream()
                .sorted(this::compareInvoiceByLatest)
                .map(this::toRevenue)
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
                .revenues(revenues)
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

        Long likeCount = baiDangYeuThichRepository
                .countByBaiDang_MaBaiDang(baiDang.getMaBaiDang());

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

    private LandlordRevenueDTO toRevenue(HoaDon hoaDon) {
        BaiDang baiDang = hoaDon.getBaiDang();

        return LandlordRevenueDTO.builder()
                .maHoaDon(hoaDon.getMaHoaDon())
                .maBaiDang(baiDang != null ? baiDang.getMaBaiDang() : null)
                .tieuDeBaiDang(baiDang != null ? baiDang.getTieuDe() : null)
                .maNguoiThue(hoaDon.getNguoiDung() != null
                        ? hoaDon.getNguoiDung().getMaNguoiDung()
                        : null)
                .tenNguoiThue(hoaDon.getNguoiDung() != null
                        ? hoaDon.getNguoiDung().getHoVaTen()
                        : null)
                .soTien(hoaDon.getSoTien())
                .ngayThanhToan(hoaDon.getNgayThanhToan())
                .ngayTao(hoaDon.getNgayTao())
                .noiDungChuyenKhoan(hoaDon.getNoiDungChuyenKhoan())
                .ghiChu(hoaDon.getGhiChu())
                .build();
    }

    private int compareInvoiceByLatest(HoaDon left, HoaDon right) {
        LocalDateTime leftTime = resolveInvoiceTime(left);
        LocalDateTime rightTime = resolveInvoiceTime(right);

        if (leftTime == null && rightTime == null) return 0;
        if (leftTime == null) return 1;
        if (rightTime == null) return -1;

        return rightTime.compareTo(leftTime);
    }

    private LocalDateTime resolveInvoiceTime(HoaDon hoaDon) {
        if (hoaDon.getNgayThanhToan() != null) {
            return hoaDon.getNgayThanhToan();
        }

        return hoaDon.getNgayTao();
    }
}
