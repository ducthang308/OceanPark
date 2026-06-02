package com.example.WebApartment.Service;

import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Models.NguoiDung;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.*;
import org.springframework.stereotype.Service;

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
            throw new RuntimeException("Không gửi được email đặt lại mật khẩu");
        }
    }

    public void sendPaymentSuccessToTenant(HoaDon hoaDon) {
        NguoiDung nguoiThue = hoaDon.getNguoiDung();

        if (nguoiThue == null || nguoiThue.getEmail() == null || nguoiThue.getEmail().isBlank()) {
            return;
        }

        BaiDang baiDang = hoaDon.getBaiDang();

        String subject = "Thanh toán thuê căn hộ thành công";

        String body = """
                Xin chào %s,

                Hệ thống đã ghi nhận thanh toán thuê căn hộ thành công.

                Mã hóa đơn: %s
                Số tiền: %,.0f VNĐ
                Bài đăng: %s
                Trạng thái: SUCCESS

                Cảm ơn bạn đã sử dụng dịch vụ.
                """.formatted(
                nguoiThue.getHoVaTen(),
                hoaDon.getMaHoaDon(),
                hoaDon.getSoTien(),
                baiDang != null ? baiDang.getTieuDe() : "Không có"
        );

        sendSimpleEmail(nguoiThue.getEmail(), subject, body);
    }

    public void sendPaymentSuccessToLandlord(HoaDon hoaDon) {
        BaiDang baiDang = hoaDon.getBaiDang();

        if (baiDang == null || baiDang.getNguoiDung() == null) {
            return;
        }

        NguoiDung nguoiChoThue = baiDang.getNguoiDung();

        if (nguoiChoThue.getEmail() == null || nguoiChoThue.getEmail().isBlank()) {
            return;
        }

        String subject = "Căn hộ của bạn đã được thuê";

        String body = """
                Xin chào %s,

                Một người thuê đã thanh toán thành công cho bài đăng của bạn.

                Mã hóa đơn: %s
                Bài đăng: %s
                Số tiền: %,.0f VNĐ
                Trạng thái bài đăng: ĐÃ THUÊ

                Doanh thu đã được ghi nhận vào ví người cho thuê của bạn.
                """.formatted(
                nguoiChoThue.getHoVaTen(),
                hoaDon.getMaHoaDon(),
                baiDang.getTieuDe(),
                hoaDon.getSoTien()
        );

        sendSimpleEmail(nguoiChoThue.getEmail(), subject, body);
    }

    public void sendPostPackagePaymentSuccess(HoaDon hoaDon) {
        NguoiDung nguoiDung = hoaDon.getNguoiDung();

        if (nguoiDung == null || nguoiDung.getEmail() == null || nguoiDung.getEmail().isBlank()) {
            return;
        }

        String subject = "Thanh toán gói đăng bài thành công";

        String body = """
                Xin chào %s,

                Bạn đã thanh toán gói đăng bài thành công.

                Mã hóa đơn: %s
                Số tiền: %,.0f VNĐ
                Thời hạn hiệu lực: 1 tháng

                Bạn có thể bắt đầu đăng bài cho thuê căn hộ.
                """.formatted(
                nguoiDung.getHoVaTen(),
                hoaDon.getMaHoaDon(),
                hoaDon.getSoTien()
        );

        sendSimpleEmail(nguoiDung.getEmail(), subject, body);
    }

    private void sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
