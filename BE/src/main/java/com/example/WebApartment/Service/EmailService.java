package com.example.WebApartment.Service;

import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietHoaDon;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Models.NguoiDung;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.*;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendPasswordResetEmail(String to, String name, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Xác nhận đặt lại mật khẩu");

            String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6">
                    <p>Xin chào %s,</p>
                    <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link này hết hạn sau 15 phút.</p>
                    <p>
                        <a href="%s" style="background:#0d6efd;color:white;padding:10px 16px;text-decoration:none;border-radius:6px">
                            Đúng là tôi
                        </a>
                    </p>
                    <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
                </div>
            """.formatted(name == null ? "bạn" : name, resetLink);

            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.out.println("Không gửi được email đặt lại mật khẩu");
            e.printStackTrace();
        }
    }

    public void sendPaymentSuccessEmail(HoaDon hoaDon, List<ChiTietHoaDon> chiTietHoaDon) {
        if (hoaDon == null || hoaDon.getNguoiDung() == null) return;

        String to = hoaDon.getNguoiDung().getEmail();
        if (to == null || to.isBlank()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Thanh toán thành công - Hóa đơn " + hoaDon.getMaHoaDon());

            String customerName = hoaDon.getNguoiDung().getHoVaTen() == null
                    ? "bạn"
                    : hoaDon.getNguoiDung().getHoVaTen();
            String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                    <p>Xin chào %s,</p>
<p>Thanh toán của bạn đã được xác nhận thành công.</p>

                    <table style="border-collapse:collapse;width:100%%;max-width:680px;margin:16px 0">
                        <tr>
                            <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Mã hóa đơn</th>
                            <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                        </tr>
                        <tr>
                            <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Loại thanh toán</th>
                            <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                        </tr>
                        <tr>
                            <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Số tiền</th>
                            <td style="border:1px solid #e5e7eb;padding:10px"><strong>%s</strong></td>
                        </tr>
                        <tr>
                            <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Ngày thanh toán</th>
                            <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                        </tr>
                        <tr>
                            <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Nội dung chuyển khoản</th>
                            <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                        </tr>
                    </table>

                    %s

                    <p>Cảm ơn bạn đã sử dụng DThang Home.</p>
                </div>
            """.formatted(
                    escapeHtml(customerName),
                    escapeHtml(hoaDon.getMaHoaDon()),
                    escapeHtml(formatInvoiceType(hoaDon.getLoaiHoaDon())),
                    escapeHtml(formatCurrency(hoaDon.getSoTien())),
                    escapeHtml(formatDateTime(hoaDon.getNgayThanhToan())),
                    escapeHtml(hoaDon.getNoiDungChuyenKhoan()),
                    buildInvoiceDetailHtml(chiTietHoaDon)
            );

            helper.setText(html, true);

            mailSender.send(message);

            System.out.println("Đã gửi email thanh toán thành công tới: " + to);

        } catch (Exception e) {
            System.out.println("Không gửi được email thanh toán thành công");
            e.printStackTrace();
        }
    }

    private String buildInvoiceDetailHtml(List<ChiTietHoaDon> chiTietHoaDon) {
        if (chiTietHoaDon == null || chiTietHoaDon.isEmpty()) return "";

        String rows = chiTietHoaDon.stream()
                .map(item -> """
                    <tr>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                        <td style="border:1px solid #e5e7eb;padding:10px;text-align:center">%s</td>
<td style="border:1px solid #e5e7eb;padding:10px;text-align:right">%s</td>
                        <td style="border:1px solid #e5e7eb;padding:10px;text-align:right">%s</td>
                    </tr>
                """.formatted(
                        escapeHtml(item.getBaiDang() != null ? item.getBaiDang().getMaBaiDang() : "-"),
                        escapeHtml(item.getBaiDang() != null ? item.getBaiDang().getTieuDe() : "-"),
                        escapeHtml(String.valueOf(item.getSoLuong() != null ? item.getSoLuong() : 1)),
                        escapeHtml(formatCurrency(item.getDonGia())),
                        escapeHtml(formatCurrency(item.getThanhTien()))
                ))
                .reduce("", String::concat);

        return """
            <h3 style="margin:20px 0 10px">Chi tiết căn hộ</h3>
            <table style="border-collapse:collapse;width:100%%;max-width:760px;margin:0 0 16px">
                <thead>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Mã bài</th>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Căn hộ</th>
                        <th style="text-align:center;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">SL</th>
                        <th style="text-align:right;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Đơn giá</th>
                        <th style="text-align:right;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>%s</tbody>
            </table>
        """.formatted(rows);
    }

    public void sendLandlordRentSuccessEmail(
            HoaDon hoaDon,
            ChiTietHoaDon item
    ) {
        if (hoaDon == null || item == null || item.getBaiDang() == null) return;

        BaiDang baiDang = item.getBaiDang();

        if (baiDang.getNguoiDung() == null) return;

        NguoiDung landlord = baiDang.getNguoiDung();

        String to = landlord.getEmail();

        if (to == null || to.isBlank()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Căn hộ của bạn đã được thuê - Hóa đơn " + hoaDon.getMaHoaDon());

            String html = """
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <p>Xin chào %s,</p>

                <p>Một căn hộ/bài đăng của bạn đã được người thuê thanh toán thành công.</p>

                <table style="border-collapse:collapse;width:100%%;max-width:680px;margin:16px 0">
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Mã hóa đơn</th>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                    </tr>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Mã bài đăng</th>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                    </tr>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Căn hộ</th>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                    </tr>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Số lượng</th>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                    </tr>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Đơn giá</th>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                    </tr>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Doanh thu ghi nhận</th>
                        <td style="border:1px solid #e5e7eb;padding:10px"><strong>%s</strong></td>
                    </tr>
                    <tr>
                        <th style="text-align:left;border:1px solid #e5e7eb;padding:10px;background:#f8fafc">Ngày thanh toán</th>
                        <td style="border:1px solid #e5e7eb;padding:10px">%s</td>
                    </tr>
                </table>

                <p>Doanh thu của căn hộ này đã được cộng vào ví người cho thuê của bạn.</p>

                <p>Cảm ơn bạn đã sử dụng DThang Home.</p>
            </div>
        """.formatted(
                    escapeHtml(landlord.getHoVaTen() == null ? "bạn" : landlord.getHoVaTen()),
                    escapeHtml(hoaDon.getMaHoaDon()),
                    escapeHtml(baiDang.getMaBaiDang()),
                    escapeHtml(baiDang.getTieuDe()),
                    escapeHtml(String.valueOf(item.getSoLuong() != null ? item.getSoLuong() : 1)),
                    escapeHtml(formatCurrency(item.getDonGia())),
                    escapeHtml(formatCurrency(item.getThanhTien())),
                    escapeHtml(formatDateTime(hoaDon.getNgayThanhToan()))
            );

            helper.setText(html, true);
            mailSender.send(message);

            System.out.println("Đã gửi email cho chủ nhà: " + to);

        } catch (Exception e) {
            System.out.println("Không gửi được email cho chủ nhà: " + to);
            e.printStackTrace();
        }
    }

    public void sendLandlordRentSuccessEmails(
            HoaDon hoaDon,
            List<ChiTietHoaDon> details
    ) {
        if (details == null || details.isEmpty()) return;

        for (ChiTietHoaDon item : details) {
            sendLandlordRentSuccessEmail(hoaDon, item);
        }
    }

    private String formatInvoiceType(String loaiHoaDon) {
        if ("DANG_BAI".equalsIgnoreCase(loaiHoaDon)) return "Thanh toán gói đăng bài";
        if ("THUE_CAN_HO".equalsIgnoreCase(loaiHoaDon)) return "Thanh toán thuê căn hộ";
        return loaiHoaDon == null ? "-" : loaiHoaDon;
    }

    private String formatCurrency(Double value) {
        if (value == null) return "0 đ";
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
        return formatter.format(value) + " đ";
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) return "-";
        return value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#039;");
    }
}