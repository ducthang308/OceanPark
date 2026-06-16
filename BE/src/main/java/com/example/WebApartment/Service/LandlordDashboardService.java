package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.LandlordDashboardDTO;
import com.example.WebApartment.DTO.LandlordPostStatsDTO;
import com.example.WebApartment.DTO.LandlordRevenueChartDTO;
import com.example.WebApartment.DTO.LandlordRevenueDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Models.ChiTietHoaDon;
import com.example.WebApartment.Models.GiaoDichVi;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Models.ViNguoiChoThue;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.BaiDangYeuThichRepository;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import com.example.WebApartment.Repository.ChiTietHoaDonRepository;
import com.example.WebApartment.Repository.GiaoDichViRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import com.example.WebApartment.Repository.ViNguoiChoThueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LandlordDashboardService {

    private static final String RENT_REVENUE = "RENT_REVENUE";
    private static final String PERIOD_DAY = "day";
    private static final String PERIOD_MONTH = "month";
    private static final String PERIOD_YEAR = "year";

    private final BaiDangRepository baiDangRepository;
    private final HoaDonRepository hoaDonRepository;
    private final ChiTietCanHoRepository chiTietCanHoRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;
    private final BaiDangYeuThichRepository baiDangYeuThichRepository;
    private final ViNguoiChoThueRepository viNguoiChoThueRepository;
    private final GiaoDichViRepository giaoDichViRepository;

    public LandlordDashboardDTO getStats(String maNguoiDung) {
        return getStats(maNguoiDung, PERIOD_MONTH, null, null);
    }

    public LandlordDashboardDTO getStats(
            String maNguoiDung,
            String period,
            String from,
            String to
    ) {
        String normalizedPeriod = normalizePeriod(period);
        LocalDateTime fromDateTime = parseDate(from, true);
        LocalDateTime toDateTime = parseDate(to, false);

        List<BaiDang> posts =
                baiDangRepository.findByNguoiDung_MaNguoiDung(maNguoiDung);

        List<HoaDon> successRentInvoices = getSuccessRentInvoices(
                maNguoiDung,
                fromDateTime,
                toDateTime
        );

        List<GiaoDichVi> revenueTransactions = getRevenueTransactions(
                maNguoiDung,
                fromDateTime,
                toDateTime
        );

        List<LandlordRevenueDTO> revenues = buildRevenues(
                revenueTransactions,
                successRentInvoices
        );

        Double totalRevenue = revenues.stream()
                .map(LandlordRevenueDTO::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);

        Long totalViews = posts.stream()
                .map(BaiDang::getLuotXem)
                .filter(Objects::nonNull)
                .reduce(0L, Long::sum);

        Long totalLikes = baiDangYeuThichRepository
                .countByBaiDang_NguoiDung_MaNguoiDung(maNguoiDung);

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
                .posts(buildPostStats(posts, revenues))
                .revenues(revenues)
                .revenueChart(buildRevenueChart(revenues, normalizedPeriod))
                .build();
    }

    private List<LandlordPostStatsDTO> buildPostStats(
            List<BaiDang> posts,
            List<LandlordRevenueDTO> revenues
    ) {
        Map<String, Double> revenueByPost = new LinkedHashMap<>();

        revenues.stream()
                .filter(revenue -> revenue.getMaBaiDang() != null)
                .forEach(revenue -> revenueByPost.merge(
                        revenue.getMaBaiDang(),
                        safeAmount(revenue.getSoTien()),
                        Double::sum
                ));

        return posts.stream()
                .map(post -> toPostStats(post, revenueByPost))
                .toList();
    }

    private LandlordPostStatsDTO toPostStats(
            BaiDang baiDang,
            Map<String, Double> revenueByPost
    ) {
        ChiTietCanHo chiTiet = chiTietCanHoRepository
                .findByBaiDang_MaBaiDang(baiDang.getMaBaiDang())
                .orElse(null);

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
                .revenue(revenueByPost.getOrDefault(baiDang.getMaBaiDang(), 0D))
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

    private LandlordRevenueDTO toRevenue(
            HoaDon hoaDon,
            ChiTietHoaDon chiTietHoaDon
    ) {
        BaiDang baiDang = chiTietHoaDon.getBaiDang();
        Double amount = chiTietHoaDon.getThanhTien();

        if (amount == null && chiTietHoaDon.getDonGia() != null && chiTietHoaDon.getSoLuong() != null) {
            amount = chiTietHoaDon.getDonGia() * chiTietHoaDon.getSoLuong();
        }

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
                .soTien(amount != null ? amount : hoaDon.getSoTien())
                .ngayThanhToan(hoaDon.getNgayThanhToan())
                .ngayTao(hoaDon.getNgayTao())
                .noiDungChuyenKhoan(hoaDon.getNoiDungChuyenKhoan())
                .ghiChu(chiTietHoaDon.getGhiChu() != null
                        ? chiTietHoaDon.getGhiChu()
                        : hoaDon.getGhiChu())
                .build();
    }

    private List<LandlordRevenueDTO> toRevenueRows(HoaDon hoaDon) {
        List<ChiTietHoaDon> details =
                chiTietHoaDonRepository.findByHoaDon_MaHoaDon(hoaDon.getMaHoaDon());

        if (details.isEmpty()) {
            return List.of(toRevenue(hoaDon));
        }

        return details.stream()
                .map(detail -> toRevenue(hoaDon, detail))
                .toList();
    }

    private LandlordRevenueDTO toRevenue(GiaoDichVi giaoDichVi) {
        HoaDon hoaDon = giaoDichVi.getHoaDon();
        BaiDang baiDang = hoaDon != null ? hoaDon.getBaiDang() : null;

        return LandlordRevenueDTO.builder()
                .maGiaoDichVi(giaoDichVi.getMaGiaoDichVi())
                .maHoaDon(hoaDon != null ? hoaDon.getMaHoaDon() : giaoDichVi.getMaGiaoDichVi())
                .maBaiDang(baiDang != null ? baiDang.getMaBaiDang() : null)
                .tieuDeBaiDang(baiDang != null ? baiDang.getTieuDe() : null)
                .maNguoiThue(hoaDon != null && hoaDon.getNguoiDung() != null
                        ? hoaDon.getNguoiDung().getMaNguoiDung()
                        : null)
                .tenNguoiThue(hoaDon != null && hoaDon.getNguoiDung() != null
                        ? hoaDon.getNguoiDung().getHoVaTen()
                        : null)
                .soTien(giaoDichVi.getSoTien())
                .ngayThanhToan(hoaDon != null ? hoaDon.getNgayThanhToan() : null)
                .ngayTao(giaoDichVi.getNgayTao())
                .noiDungChuyenKhoan(hoaDon != null ? hoaDon.getNoiDungChuyenKhoan() : null)
                .ghiChu(giaoDichVi.getNoiDung())
                .build();
    }

    private List<LandlordRevenueDTO> buildRevenues(
            List<GiaoDichVi> revenueTransactions,
            List<HoaDon> successRentInvoices
    ) {
        List<LandlordRevenueDTO> revenues = new ArrayList<>();
        Set<String> successInvoiceIds = new HashSet<>();

        successRentInvoices.forEach(hoaDon -> {
            if (hoaDon.getMaHoaDon() != null) {
                successInvoiceIds.add(hoaDon.getMaHoaDon());
            }

            revenues.addAll(toRevenueRows(hoaDon));
        });

        revenueTransactions.stream()
                .filter(giaoDichVi -> giaoDichVi.getHoaDon() == null
                        || giaoDichVi.getHoaDon().getMaHoaDon() == null
                        || !successInvoiceIds.contains(giaoDichVi.getHoaDon().getMaHoaDon()))
                .map(this::toRevenue)
                .forEach(revenues::add);

        return revenues.stream()
                .sorted(this::compareRevenueByLatest)
                .toList();
    }

    private List<HoaDon> getSuccessRentInvoices(
            String maNguoiDung,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime
    ) {
        return hoaDonRepository
                .findByBaiDang_NguoiDung_MaNguoiDungAndLoaiHoaDonAndTrangThaiThanhToan(
                        maNguoiDung,
                        "THUE_CAN_HO",
                        "SUCCESS"
                )
                .stream()
                .filter(hoaDon -> isInRange(resolveRevenueTime(hoaDon), fromDateTime, toDateTime))
                .toList();
    }

    private List<GiaoDichVi> getRevenueTransactions(
            String maNguoiDung,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime
    ) {
        ViNguoiChoThue vi = viNguoiChoThueRepository
                .findFirstByNguoiDung_MaNguoiDungOrderByNgayTaoAsc(maNguoiDung)
                .orElse(null);

        if (vi == null) return List.of();

        return giaoDichViRepository.findByVi_MaViOrderByNgayTaoDesc(vi.getMaVi())
                .stream()
                .filter(gdv -> gdv.getLoaiGiaoDich() != null
                        && RENT_REVENUE.equalsIgnoreCase(gdv.getLoaiGiaoDich()))
                .filter(gdv -> isInRange(gdv.getNgayTao(), fromDateTime, toDateTime))
                .toList();
    }

    private List<LandlordRevenueChartDTO> buildRevenueChart(
            List<LandlordRevenueDTO> revenues,
            String period
    ) {
        Map<String, LandlordRevenueChartDTO> buckets = new LinkedHashMap<>();

        revenues.stream()
                .filter(revenue -> resolveRevenueTime(revenue) != null)
                .sorted((left, right) -> resolveRevenueTime(left).compareTo(resolveRevenueTime(right)))
                .forEach(revenue -> {
                    LocalDateTime revenueTime = resolveRevenueTime(revenue);
                    String key = buildPeriodKey(revenueTime, period);
                    LandlordRevenueChartDTO current = buckets.computeIfAbsent(
                            key,
                            ignored -> LandlordRevenueChartDTO.builder()
                                    .period(period)
                                    .label(buildPeriodLabel(revenueTime, period))
                                    .revenue(0D)
                                    .transactionCount(0L)
                                    .build()
                    );

                    current.setRevenue(current.getRevenue() + safeAmount(revenue.getSoTien()));
                    current.setTransactionCount(current.getTransactionCount() + 1);
                });

        return buckets.values().stream().toList();
    }

    private boolean isInRange(
            LocalDateTime value,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime
    ) {
        if (value == null) return false;
        if (fromDateTime != null && value.isBefore(fromDateTime)) return false;

        return toDateTime == null || value.isBefore(toDateTime);
    }

    private Double safeAmount(Double value) {
        return value != null ? value : 0D;
    }

    private String normalizePeriod(String period) {
        if (PERIOD_DAY.equalsIgnoreCase(period)) return PERIOD_DAY;
        if (PERIOD_YEAR.equalsIgnoreCase(period)) return PERIOD_YEAR;

        return PERIOD_MONTH;
    }

    private LocalDateTime parseDate(String value, boolean startOfDay) {
        if (value == null || value.isBlank()) return null;

        try {
            LocalDate date = LocalDate.parse(value);
            return startOfDay ? date.atStartOfDay() : date.plusDays(1).atStartOfDay();
        } catch (Exception ignored) {
            return null;
        }
    }

    private String buildPeriodKey(LocalDateTime value, String period) {
        if (PERIOD_DAY.equals(period)) {
            return value.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }

        if (PERIOD_YEAR.equals(period)) {
            return value.format(DateTimeFormatter.ofPattern("yyyy"));
        }

        return value.format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    private String buildPeriodLabel(LocalDateTime value, String period) {
        if (PERIOD_DAY.equals(period)) {
            return value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }

        if (PERIOD_YEAR.equals(period)) {
            return value.format(DateTimeFormatter.ofPattern("yyyy"));
        }

        return value.format(DateTimeFormatter.ofPattern("MM/yyyy"));
    }

    private int compareRevenueByLatest(
            LandlordRevenueDTO left,
            LandlordRevenueDTO right
    ) {
        LocalDateTime leftTime = resolveRevenueTime(left);
        LocalDateTime rightTime = resolveRevenueTime(right);

        if (leftTime == null && rightTime == null) return 0;
        if (leftTime == null) return 1;
        if (rightTime == null) return -1;

        return rightTime.compareTo(leftTime);
    }

    private LocalDateTime resolveRevenueTime(LandlordRevenueDTO revenue) {
        if (revenue == null) return null;
        if (revenue.getNgayThanhToan() != null) return revenue.getNgayThanhToan();

        return revenue.getNgayTao();
    }

    private LocalDateTime resolveRevenueTime(HoaDon hoaDon) {
        if (hoaDon == null) return null;
        if (hoaDon.getNgayThanhToan() != null) return hoaDon.getNgayThanhToan();

        return hoaDon.getNgayTao();
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
