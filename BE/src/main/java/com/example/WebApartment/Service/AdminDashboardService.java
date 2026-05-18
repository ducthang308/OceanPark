package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.ActivityDTO;
import com.example.WebApartment.DTO.DashboardStatsDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final String POST_PENDING = "PENDING";
    private static final String PAYMENT_SUCCESS = "SUCCESS";
    private static final List<String> POST_APPROVED_STATUSES = List.of("ACTIVE", "APPROVED", "DA_DUYET");
    private static final List<String> POST_REJECTED_STATUSES = List.of("REJECTED", "TU_CHOI");
    private static final List<String> PAYMENT_PENDING_STATUSES = List.of("PENDING", "CHO_DUYET");

    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;
    private final HoaDonRepository hoaDonRepository;

    public DashboardStatsDTO getStats() {
        List<BaiDang> posts = baiDangRepository.findAll();
        List<HoaDon> invoices = hoaDonRepository.findAll();

        Double totalRevenue = invoices.stream()
                .filter(this::isPaymentSuccess)
                .map(HoaDon::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);
        Double monthRevenue = invoices.stream()
                .filter(this::isPaymentSuccess)
                .filter(invoice -> isSameMonth(getInvoiceDate(invoice), YearMonth.now()))
                .map(HoaDon::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);

        return DashboardStatsDTO.builder()
                .totalUsers(nguoiDungRepository.count())
                .totalPosts((long) posts.size())
                .pendingPosts(posts.stream().filter(this::isPostPending).count())
                .approvedPosts(posts.stream().filter(this::isPostApproved).count())
                .rejectedPosts(posts.stream().filter(this::isPostRejected).count())
                .pendingPayments(invoices.stream().filter(this::isPaymentPending).count())
                .confirmedPayments(invoices.stream().filter(this::isPaymentSuccess).count())
                .totalRevenue(totalRevenue)
                .monthRevenue(monthRevenue)
                .monthlyStats(buildMonthlyStats(posts, invoices))
                .queueItems(buildQueueItems(posts, invoices))
                .recentActivity(buildRecentActivity(posts, invoices))
                .build();
    }

    private List<DashboardStatsDTO.MonthlyDashboardPointDTO> buildMonthlyStats(
            List<BaiDang> posts,
            List<HoaDon> invoices
    ) {
        List<DashboardStatsDTO.MonthlyDashboardPointDTO> points = new ArrayList<>();

        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            long approvedPosts = posts.stream()
                    .filter(this::isPostApproved)
                    .filter(post -> isSameMonth(post.getNgayDang(), month))
                    .count();
            long pendingPosts = posts.stream()
                    .filter(this::isPostPending)
                    .filter(post -> isSameMonth(post.getNgayDang(), month))
                    .count();
            long confirmedPayments = invoices.stream()
                    .filter(this::isPaymentSuccess)
                    .filter(invoice -> isSameMonth(getInvoiceDate(invoice), month))
                    .count();
            double revenue = invoices.stream()
                    .filter(this::isPaymentSuccess)
                    .filter(invoice -> isSameMonth(getInvoiceDate(invoice), month))
                    .map(HoaDon::getSoTien)
                    .filter(Objects::nonNull)
                    .reduce(0D, Double::sum);

            points.add(DashboardStatsDTO.MonthlyDashboardPointDTO.builder()
                    .label("T" + month.getMonthValue())
                    .approvedPosts(approvedPosts)
                    .pendingPosts(pendingPosts)
                    .confirmedPayments(confirmedPayments)
                    .revenue(revenue)
                    .build());
        }

        return points;
    }

    private List<DashboardStatsDTO.DashboardQueueItemDTO> buildQueueItems(
            List<BaiDang> posts,
            List<HoaDon> invoices
    ) {
        Stream<DashboardStatsDTO.DashboardQueueItemDTO> postQueue = posts.stream()
                .filter(this::isPostPending)
                .map(this::toPostQueueItem);
        Stream<DashboardStatsDTO.DashboardQueueItemDTO> paymentQueue = invoices.stream()
                .filter(this::isPaymentPending)
                .map(this::toInvoiceQueueItem);

        return Stream.concat(postQueue, paymentQueue)
                .filter(item -> item.getCreatedAt() != null)
                .sorted(Comparator.comparing(DashboardStatsDTO.DashboardQueueItemDTO::getCreatedAt).reversed())
                .limit(8)
                .toList();
    }

    private List<ActivityDTO> buildRecentActivity(List<BaiDang> posts, List<HoaDon> invoices) {
        Stream<ActivityDTO> postActivities = posts.stream().map(this::toPostActivity);
        Stream<ActivityDTO> invoiceActivities = invoices.stream().map(this::toInvoiceActivity);

        return Stream.concat(postActivities, invoiceActivities)
                .filter(activity -> activity.getTimestamp() != null)
                .sorted(Comparator.comparing(ActivityDTO::getTimestamp).reversed())
                .limit(8)
                .toList();
    }

    private DashboardStatsDTO.DashboardQueueItemDTO toPostQueueItem(BaiDang post) {
        String title = post.getTieuDe() != null ? post.getTieuDe() : post.getMaBaiDang();
        String owner = post.getNguoiDung() != null ? post.getNguoiDung().getHoVaTen() : "Chưa có người đăng";
        String category = post.getDanhMuc() != null ? post.getDanhMuc().getTenDanhMuc() : "Bài đăng";

        return DashboardStatsDTO.DashboardQueueItemDTO.builder()
                .id(post.getMaBaiDang())
                .type("post")
                .title(title)
                .meta(owner + " • " + category)
                .status("Chờ duyệt")
                .createdAt(post.getNgayDang())
                .build();
    }

    private DashboardStatsDTO.DashboardQueueItemDTO toInvoiceQueueItem(HoaDon invoice) {
        String owner = invoice.getNguoiDung() != null ? invoice.getNguoiDung().getHoVaTen() : "Chưa có người dùng";

        return DashboardStatsDTO.DashboardQueueItemDTO.builder()
                .id(invoice.getMaHoaDon())
                .type("payment")
                .title("Hóa đơn " + invoice.getMaHoaDon())
                .meta(owner + " • " + formatMoney(invoice.getSoTien()))
                .status("Chờ đối soát")
                .createdAt(getInvoiceDate(invoice))
                .build();
    }

    private ActivityDTO toPostActivity(BaiDang post) {
        String status = post.getTrangThai() != null ? post.getTrangThai() : "UNKNOWN";
        String title = post.getTieuDe() != null ? post.getTieuDe() : post.getMaBaiDang();

        return ActivityDTO.builder()
                .id(post.getMaBaiDang())
                .type("post_" + status.toLowerCase())
                .description("Bài đăng \"" + title + "\" đang ở trạng thái " + status)
                .timestamp(post.getNgayDang())
                .build();
    }

    private ActivityDTO toInvoiceActivity(HoaDon invoice) {
        LocalDateTime timestamp = getInvoiceDate(invoice);
        String status = invoice.getTrangThaiThanhToan() != null
                ? invoice.getTrangThaiThanhToan()
                : "UNKNOWN";

        return ActivityDTO.builder()
                .id(invoice.getMaHoaDon())
                .type("invoice_" + status.toLowerCase())
                .description("Hóa đơn " + invoice.getMaHoaDon() + " đang ở trạng thái " + status)
                .timestamp(timestamp)
                .build();
    }

    private boolean isPostPending(BaiDang post) {
        return POST_PENDING.equalsIgnoreCase(post.getTrangThai());
    }

    private boolean isPostApproved(BaiDang post) {
        return POST_APPROVED_STATUSES.stream()
                .anyMatch(status -> status.equalsIgnoreCase(post.getTrangThai()));
    }

    private boolean isPostRejected(BaiDang post) {
        return POST_REJECTED_STATUSES.stream()
                .anyMatch(status -> status.equalsIgnoreCase(post.getTrangThai()));
    }

    private boolean isPaymentSuccess(HoaDon invoice) {
        return PAYMENT_SUCCESS.equalsIgnoreCase(invoice.getTrangThaiThanhToan());
    }

    private boolean isPaymentPending(HoaDon invoice) {
        return PAYMENT_PENDING_STATUSES.stream()
                .anyMatch(status -> status.equalsIgnoreCase(invoice.getTrangThaiThanhToan()));
    }

    private boolean isSameMonth(LocalDateTime date, YearMonth month) {
        return date != null && YearMonth.from(date).equals(month);
    }

    private LocalDateTime getInvoiceDate(HoaDon invoice) {
        return invoice.getNgayThanhToan() != null
                ? invoice.getNgayThanhToan()
                : invoice.getNgayTao();
    }

    private String formatMoney(Double value) {
        if (value == null) {
            return "0 đ";
        }

        return String.format("%,.0f đ", value);
    }
}
