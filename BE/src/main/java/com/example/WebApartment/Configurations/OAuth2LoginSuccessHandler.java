package com.example.WebApartment.Configurations;

import com.example.WebApartment.JWT.JwtToken;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Models.VaiTro;
import com.example.WebApartment.Repository.NguoiDungRepository;
import com.example.WebApartment.Repository.VaiTroRepository;
import com.example.WebApartment.Service.NguoiDungCodeService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final NguoiDungCodeService nguoiDungCodeService;
    private final JwtToken jwtToken;

    @Value("${app.oauth2.redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");

        if (email == null || email.isBlank()) {
            response.sendRedirect(redirectUrl + "?error=email_not_found");
            return;
        }

        NguoiDung nguoiDung = nguoiDungRepository.findByEmail(email)
                .map(existingUser -> syncGoogleUser(existingUser, name, picture))
                .orElseGet(() -> createGoogleUser(email, name, picture));

        if (Boolean.FALSE.equals(nguoiDung.getTrangThai())) {
            response.sendRedirect(redirectUrl + "?error=account_locked");
            return;
        }

        String token;
        try {
            token = jwtToken.generationToken(nguoiDung);
        } catch (Exception e) {
            response.sendRedirect(redirectUrl + "?error=token_error");
            return;
        }

        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl + "?token=" + encodedToken);
    }

    private NguoiDung createGoogleUser(String email, String name, String picture) {
        VaiTro vaiTroNguoiThue = vaiTroRepository.findById("2")
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role Người Thuê"));

        NguoiDung newUser = NguoiDung.builder()
                .maNguoiDung(nguoiDungCodeService.generateMaNguoiDung())
                .vaiTro(vaiTroNguoiThue)
                .hoVaTen(name)
                .email(email)
                .soDienThoai("GG_" + UUID.randomUUID().toString().substring(0, 8))
                .matKhau("")
                .trangThai(true)
                .anhDaiDien(picture)
                .build();

        return nguoiDungRepository.save(newUser);
    }

    private NguoiDung syncGoogleUser(NguoiDung nguoiDung, String name, String picture) {
        boolean changed = false;

        if ((nguoiDung.getAnhDaiDien() == null || nguoiDung.getAnhDaiDien().isBlank())
                && picture != null && !picture.isBlank()) {
            nguoiDung.setAnhDaiDien(picture);
            changed = true;
        }

        if ((nguoiDung.getHoVaTen() == null || nguoiDung.getHoVaTen().isBlank())
                && name != null && !name.isBlank()) {
            nguoiDung.setHoVaTen(name);
            changed = true;
        }

        return changed ? nguoiDungRepository.save(nguoiDung) : nguoiDung;
    }
}
