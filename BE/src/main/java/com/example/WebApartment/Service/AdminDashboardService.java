package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.DashboardChartDTO;
import com.example.WebApartment.DTO.DashboardChartSeriesDTO;
import com.example.WebApartment.DTO.DashboardStatsDTO;
import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.GiaoDich;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.GiaoDichRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final String ROLE_ADMIN = "1";
    private static final String ROLE_NGUOI_THUE = "2";
    private static final String ROLE_NGUOI_CHO_THUE = "3";

    private static final String INVOICE_DANG_BAI = "DANG_BAI";
    private static final String PAYMENT_SUCCESS = "SUCCESS";
    private static final String PAYMENT_PENDING = "PENDING";
    private static final String POST_ACTIVE = "ACTIVE";
    private static final String POST_RENTED = "DA_THUE";
    private static final String POST_PENDING = "PENDING";

    private static final String TYPE_DAY = "day";
    private static final String TYPE_MONTH = "month";
    private static final String TYPE_YEAR = "year";

    private final HoaDonRepository hoaDonRepository;
    private final GiaoDichRepository giaoDichRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;

    public DashboardStatsDTO getStats() {
        return getOverview();
    }

    public DashboardStatsDTO getOverview() {
        List<RevenueRecord> revenueRecords = findRevenueRecords();

        double totalRevenue = revenueRecords.stream()
                .map(RevenueRecord::amount)
                .reduce(0D, Double::sum);

        return DashboardStatsDTO.builder()
                .totalRevenue(totalRevenue)
                .totalUsers(nguoiDungRepository.count())
                .totalRenters(nguoiDungRepository.countByVaiTro_MaVaiTro(ROLE_NGUOI_THUE))
                .totalLandlords(nguoiDungRepository.countByVaiTro_MaVaiTro(ROLE_NGUOI_CHO_THUE))
                .totalAdmins(nguoiDungRepository.countByVaiTro_MaVaiTro(ROLE_ADMIN))
                .totalPosts(baiDangRepository.count())
                .activePosts(baiDangRepository.countByTrangThaiIgnoreCase(POST_ACTIVE))
                .rentedPosts(baiDangRepository.countByTrangThaiIgnoreCase(POST_RENTED))
                .pendingPosts(baiDangRepository.countByTrangThaiIgnoreCase(POST_PENDING))
                .pendingPayments(hoaDonRepository.countByTrangThaiThanhToanIgnoreCase(PAYMENT_PENDING))
                .build();
    }

    public DashboardChartDTO getRevenueChart(String type) {
        String normalizedType = normalizeType(type);
        List<RevenueRecord> revenueRecords = findRevenueRecords();
        List<ChartBucket> buckets = buildBuckets(normalizedType);
        Map<String, Double> revenueByBucket = initBucketMap(buckets);

        for (RevenueRecord record : revenueRecords) {
            if (record.date() == null) {
                continue;
            }

            String bucketKey = toBucketKey(record.date(), normalizedType);

            if (revenueByBucket.containsKey(bucketKey)) {
                revenueByBucket.merge(bucketKey, record.amount(), Double::sum);
            }
        }

        List<Double> values = toValues(buckets, revenueByBucket);

        return DashboardChartDTO.builder()
                .labels(toLabels(buckets))
                .values(values)
                .series(List.of(
                        DashboardChartSeriesDTO.builder()
                                .name("Doanh thu")
                                .values(values)
                                .build()
                ))
                .build();
    }

    public DashboardChartDTO getPostChart(String type) {
        String normalizedType = normalizeType(type);
        List<BaiDang> posts = baiDangRepository.findAll();
        List<ChartBucket> buckets = buildBuckets(normalizedType);
        Map<String, Double> totalByBucket = initBucketMap(buckets);
        Map<String, Double> activeByBucket = initBucketMap(buckets);
        Map<String, Double> rentedByBucket = initBucketMap(buckets);

        for (BaiDang baiDang : posts) {
            LocalDateTime ngayDang = baiDang.getNgayDang();

            if (ngayDang == null) {
                continue;
            }

            String bucketKey = toBucketKey(ngayDang, normalizedType);

            if (!totalByBucket.containsKey(bucketKey)) {
                continue;
            }

            totalByBucket.merge(bucketKey, 1D, Double::sum);

            String trangThai = baiDang.getTrangThai();

            if (POST_ACTIVE.equalsIgnoreCase(trangThai)) {
                activeByBucket.merge(bucketKey, 1D, Double::sum);
            }

            if (POST_RENTED.equalsIgnoreCase(trangThai)) {
                rentedByBucket.merge(bucketKey, 1D, Double::sum);
            }
        }

        List<Double> totalValues = toValues(buckets, totalByBucket);

        return DashboardChartDTO.builder()
                .labels(toLabels(buckets))
                .values(totalValues)
                .series(List.of(
                        DashboardChartSeriesDTO.builder()
                                .name("Tổng bài đăng")
                                .values(totalValues)
                                .build(),
                        DashboardChartSeriesDTO.builder()
                                .name(POST_ACTIVE)
                                .values(toValues(buckets, activeByBucket))
                                .build(),
                        DashboardChartSeriesDTO.builder()
                                .name(POST_RENTED)
                                .values(toValues(buckets, rentedByBucket))
                                .build()
                ))
                .build();
    }

    public DashboardChartDTO getUserChart() {
        List<String> labels = List.of("Admin", "Người thuê", "Người cho thuê");
        List<Double> values = List.of(
                (double) nguoiDungRepository.countByVaiTro_MaVaiTro(ROLE_ADMIN),
                (double) nguoiDungRepository.countByVaiTro_MaVaiTro(ROLE_NGUOI_THUE),
                (double) nguoiDungRepository.countByVaiTro_MaVaiTro(ROLE_NGUOI_CHO_THUE)
        );

        return DashboardChartDTO.builder()
                .labels(labels)
                .values(values)
                .series(List.of(
                        DashboardChartSeriesDTO.builder()
                                .name("Số người dùng")
                                .values(values)
                                .build()
                ))
                .build();
    }

    public List<BaiDangDTO> getPendingPosts(Integer limit) {
        int safeLimit = limit == null ? 6 : Math.max(1, Math.min(limit, 20));

        return baiDangRepository
                .findByTrangThaiIgnoreCaseOrderByNgayDangDesc(
                        POST_PENDING,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(this::toBaiDangDTO)
                .toList();
    }

    private List<GiaoDich> findValidRevenueTransactions() {
        return giaoDichRepository.findValidRevenueTransactions(
                PAYMENT_SUCCESS,
                INVOICE_DANG_BAI,
                ROLE_NGUOI_CHO_THUE
        );
    }

    private List<RevenueRecord> findRevenueRecords() {
        Map<String, RevenueRecord> recordsByInvoice = new LinkedHashMap<>();

        for (HoaDon hoaDon : hoaDonRepository.findByLoaiHoaDonAndTrangThaiThanhToan(
                INVOICE_DANG_BAI,
                PAYMENT_SUCCESS
        )) {
            if (!isLandlordInvoice(hoaDon)) {
                continue;
            }

            recordsByInvoice.put(
                    hoaDon.getMaHoaDon(),
                    new RevenueRecord(
                            valueOrZero(hoaDon.getSoTien()),
                            firstNotNull(hoaDon.getNgayThanhToan(), hoaDon.getNgayTao())
                    )
            );
        }

        for (GiaoDich giaoDich : findValidRevenueTransactions()) {
            HoaDon hoaDon = giaoDich.getHoaDon();
            String key = hoaDon != null && hoaDon.getMaHoaDon() != null
                    ? hoaDon.getMaHoaDon()
                    : giaoDich.getMaGiaoDich();

            recordsByInvoice.put(
                    key,
                    new RevenueRecord(
                            valueOrZero(getRevenueAmount(giaoDich)),
                            getRevenueDate(giaoDich)
                    )
            );
        }

        return new ArrayList<>(recordsByInvoice.values());
    }

    private boolean isLandlordInvoice(HoaDon hoaDon) {
        return hoaDon != null
                && hoaDon.getNguoiDung() != null
                && hoaDon.getNguoiDung().getVaiTro() != null
                && ROLE_NGUOI_CHO_THUE.equals(hoaDon.getNguoiDung().getVaiTro().getMaVaiTro());
    }

    private Double getRevenueAmount(GiaoDich giaoDich) {
        if (giaoDich.getSoTien() != null) {
            return giaoDich.getSoTien();
        }

        if (giaoDich.getHoaDon() != null) {
            return giaoDich.getHoaDon().getSoTien();
        }

        return 0D;
    }

    private LocalDateTime getRevenueDate(GiaoDich giaoDich) {
        if (giaoDich.getNgayTao() != null) {
            return giaoDich.getNgayTao();
        }

        if (giaoDich.getHoaDon() != null && giaoDich.getHoaDon().getNgayThanhToan() != null) {
            return giaoDich.getHoaDon().getNgayThanhToan();
        }

        if (giaoDich.getHoaDon() != null) {
            return giaoDich.getHoaDon().getNgayTao();
        }

        return null;
    }

    private String normalizeType(String type) {
        if (TYPE_DAY.equalsIgnoreCase(type)) {
            return TYPE_DAY;
        }

        if (TYPE_YEAR.equalsIgnoreCase(type)) {
            return TYPE_YEAR;
        }

        return TYPE_MONTH;
    }

    private List<ChartBucket> buildBuckets(String type) {
        LocalDate today = LocalDate.now();

        if (TYPE_DAY.equals(type)) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

            return IntStream.range(0, 7)
                    .mapToObj(index -> today.minusDays(6L - index))
                    .map(date -> new ChartBucket(date.toString(), date.format(formatter)))
                    .toList();
        }

        if (TYPE_YEAR.equals(type)) {
            int currentYear = today.getYear();

            return IntStream.range(0, 5)
                    .mapToObj(index -> String.valueOf(currentYear - 4 + index))
                    .map(year -> new ChartBucket(year, year))
                    .toList();
        }

        YearMonth currentMonth = YearMonth.from(today);

        return IntStream.range(0, 12)
                .mapToObj(index -> currentMonth.minusMonths(11L - index))
                .map(month -> new ChartBucket(
                        month.toString(),
                        "T" + month.getMonthValue() + "/" + month.getYear()
                ))
                .toList();
    }


    private String toBucketKey(LocalDateTime dateTime, String type) {
        if (TYPE_DAY.equals(type)) {
            return dateTime.toLocalDate().toString();
        }

        if (TYPE_YEAR.equals(type)) {
            return String.valueOf(dateTime.getYear());
        }

        return YearMonth.from(dateTime).toString();
    }

    private Map<String, Double> initBucketMap(List<ChartBucket> buckets) {
        Map<String, Double> result = new LinkedHashMap<>();

        for (ChartBucket bucket : buckets) {
            result.put(bucket.key(), 0D);
        }

        return result;
    }

    private List<String> toLabels(List<ChartBucket> buckets) {
        return buckets.stream()
                .map(ChartBucket::label)
                .toList();
    }

    private List<Double> toValues(List<ChartBucket> buckets, Map<String, Double> valuesByBucket) {
        return buckets.stream()
                .map(bucket -> valueOrZero(valuesByBucket.get(bucket.key())))
                .toList();
    }

    private Double valueOrZero(Double value) {
        return value != null ? value : 0D;
    }

    private LocalDateTime firstNotNull(LocalDateTime first, LocalDateTime second) {
        return first != null ? first : second;
    }

    private BaiDangDTO toBaiDangDTO(BaiDang baiDang) {
        if (baiDang == null) {
            return null;
        }

        return BaiDangDTO.builder()
                .maBaiDang(baiDang.getMaBaiDang())
                .maNguoiDung(baiDang.getNguoiDung() != null ? baiDang.getNguoiDung().getMaNguoiDung() : null)
                .maDanhMuc(baiDang.getDanhMuc() != null ? baiDang.getDanhMuc().getMaDanhMuc() : null)
                .tieuDe(baiDang.getTieuDe())
                .noiDung(baiDang.getNoiDung())
                .ngayDang(baiDang.getNgayDang())
                .trangThai(baiDang.getTrangThai())
                .lienHe(baiDang.getLienHe())
                .hinhThucThanhToan(baiDang.getHinhThucThanhToan())
                .luotXem(baiDang.getLuotXem())
                .build();
    }

    private record RevenueRecord(Double amount, LocalDateTime date) {
    }

    private record ChartBucket(String key, String label) {
    }
}
