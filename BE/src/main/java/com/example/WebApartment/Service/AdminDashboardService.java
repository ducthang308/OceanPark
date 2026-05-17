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
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final String POST_PENDING = "PENDING";
    private static final String PAYMENT_SUCCESS = "SUCCESS";

    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;
    private final HoaDonRepository hoaDonRepository;

    public DashboardStatsDTO getStats() {
        List<HoaDon> invoices = hoaDonRepository.findAll();

        Double totalRevenue = invoices.stream()
                .filter(invoice -> PAYMENT_SUCCESS.equalsIgnoreCase(invoice.getTrangThaiThanhToan()))
                .map(HoaDon::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);

        return DashboardStatsDTO.builder()
                .totalUsers(nguoiDungRepository.count())
                .totalPosts(baiDangRepository.count())
                .pendingPosts(baiDangRepository.countByTrangThaiIgnoreCase(POST_PENDING))
                .totalRevenue(totalRevenue)
                .recentActivity(buildRecentActivity())
                .build();
    }

    private List<ActivityDTO> buildRecentActivity() {
        Stream<ActivityDTO> postActivities = baiDangRepository.findAll()
                .stream()
                .map(this::toPostActivity);

        Stream<ActivityDTO> invoiceActivities = hoaDonRepository.findAll()
                .stream()
                .map(this::toInvoiceActivity);

        return Stream.concat(postActivities, invoiceActivities)
                .filter(activity -> activity.getTimestamp() != null)
                .sorted(Comparator.comparing(ActivityDTO::getTimestamp).reversed())
                .limit(8)
                .toList();
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
        LocalDateTime timestamp = invoice.getNgayThanhToan() != null
                ? invoice.getNgayThanhToan()
                : invoice.getNgayTao();
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
}
