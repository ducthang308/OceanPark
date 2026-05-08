package com.example.WebApartment.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
}
