package com.example.WebApartment.Service;

import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietHoaDon;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Models.NguoiDung;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
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
    private final InvoicePdfService invoicePdfService;

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
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

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
                    <p>Hóa đơn PDF đã được đính kèm trong email này.</p>
                    <p><strong>Mã hóa đơn:</strong> %s<br/>
                       <strong>Số tiền:</strong> %s<br/>
                       <strong>Ngày thanh toán:</strong> %s</p>
                    <p>Cảm ơn bạn đã sử dụng DThang Home.</p>
                </div>
            """.formatted(
                    escapeHtml(customerName),
                    escapeHtml(hoaDon.getMaHoaDon()),
                    escapeHtml(formatCurrency(hoaDon.getSoTien())),
                    escapeHtml(formatDateTime(hoaDon.getNgayThanhToan()))
            );

            helper.setText(html, true);
            addAttachmentSafely(
                    helper,
                    buildInvoiceFileName("hoa-don", hoaDon.getMaHoaDon()),
                    () -> invoicePdfService.buildCustomerPaymentInvoice(hoaDon, chiTietHoaDon),
                    hoaDon.getMaHoaDon()
            );

            mailSender.send(message);

            System.out.println("Đã gửi email thanh toán thành công tới: " + to);

        } catch (Exception e) {
            System.out.println("Không gửi được email thanh toán thành công");
            e.printStackTrace();
        }
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
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Căn hộ của bạn đã được thuê - Hóa đơn " + hoaDon.getMaHoaDon());

            String html = """
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <p>Xin chào %s,</p>

                <p>Một căn hộ/bài đăng của bạn đã được người thuê thanh toán thành công.</p>
                <p>Phiếu ghi nhận doanh thu dạng PDF đã được đính kèm trong email này.</p>
                <p><strong>Mã hóa đơn:</strong> %s<br/>
                   <strong>Mã bài đăng:</strong> %s<br/>
                   <strong>Căn hộ:</strong> %s<br/>
                   <strong>Doanh thu ghi nhận:</strong> %s</p>
                <p>Doanh thu của căn hộ này đã được cộng vào ví người cho thuê của bạn.</p>

                <p>Cảm ơn bạn đã sử dụng DThang Home.</p>
            </div>
        """.formatted(
                    escapeHtml(landlord.getHoVaTen() == null ? "bạn" : landlord.getHoVaTen()),
                    escapeHtml(hoaDon.getMaHoaDon()),
                    escapeHtml(baiDang.getMaBaiDang()),
                    escapeHtml(baiDang.getTieuDe()),
                    escapeHtml(formatCurrency(item.getThanhTien()))
            );

            helper.setText(html, true);
            addAttachmentSafely(
                    helper,
                    buildInvoiceFileName("phieu-doanh-thu", hoaDon.getMaHoaDon() + "-" + baiDang.getMaBaiDang()),
                    () -> invoicePdfService.buildLandlordRentInvoice(hoaDon, item),
                    hoaDon.getMaHoaDon()
            );
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

    private String buildInvoiceFileName(String prefix, String code) {
        String safeCode = code == null || code.isBlank() ? "hoa-don" : code.replaceAll("[^A-Za-z0-9_-]", "-");
        return prefix + "-" + safeCode + ".pdf";
    }

    private void addAttachmentSafely(
            MimeMessageHelper helper,
            String fileName,
            PdfContentBuilder pdfContentBuilder,
            String invoiceCode
    ) {
        try {
            byte[] pdfBytes = pdfContentBuilder.build();

            System.out.println("PDF FILE NAME = " + fileName);
            System.out.println("PDF SIZE = " + pdfBytes.length + " bytes");

            if (pdfBytes.length == 0) {
                throw new RuntimeException("PDF rỗng");
            }

            helper.addAttachment(
                    fileName,
                    new ByteArrayResource(pdfBytes) {
                        @Override
                        public String getFilename() {
                            return fileName;
                        }
                    },
                    "application/pdf"
            );

            System.out.println("Đã đính kèm PDF cho hóa đơn " + invoiceCode);

        } catch (Exception e) {
            System.err.println("Không thể đính kèm PDF cho hóa đơn " + invoiceCode);
            e.printStackTrace();
        }
    }

    @FunctionalInterface
    private interface PdfContentBuilder {
        byte[] build() throws Exception;
    }
}
