package com.example.WebApartment.JWT;

import com.example.WebApartment.Models.NguoiDung;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.util.Pair;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    @Value("${api.prefix}")
    private String apiPrefix;

    private final UserDetailsService userDetailsService;
    private final JwtToken jwtToken;

    @Override
    protected void doFilterInternal(@NotNull HttpServletRequest request,
                                    @NotNull HttpServletResponse response,
                                    @NotNull FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getServletPath();

        if (path.startsWith("/oauth2/")
                || path.startsWith("/login/oauth2/")
                || path.equals("/login")) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            if (isByPassToken(request)) {
                filterChain.doFilter(request, response);
                return;
            }

            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Thiếu Authorization header hoặc token không bắt đầu bằng Bearer"
                );
                return;
            }

            String token = authHeader.substring(7);

            // Token đang lưu subject là số điện thoại
            String soDienThoai = jwtToken.extractPhone(token);

            if (soDienThoai != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                NguoiDung nguoiDung =
                        (NguoiDung) userDetailsService.loadUserByUsername(soDienThoai);

                if (jwtToken.validateToken(token, nguoiDung)) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    nguoiDung,
                                    null,
                                    nguoiDung.getAuthorities()
                            );

                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                } else {
                    response.sendError(
                            HttpServletResponse.SC_UNAUTHORIZED,
                            "Token không hợp lệ"
                    );
                    return;
                }
            }

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Không xác thực được token: " + e.getMessage());
        }
    }

    private boolean isByPassToken(@NotNull HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || isPublicGetRequest(request)) {
            return true;
        }

        final List<Pair<String, String>> byPassTokens = Arrays.asList(
                Pair.of(String.format("%s/nguoi-dung/login", apiPrefix), "POST"),
                Pair.of(String.format("%s/nguoi-dung/register", apiPrefix), "POST"),

                Pair.of(String.format("%s/sepay/webhook", apiPrefix), "POST"),
                Pair.of(String.format("%s/nguoi-dung/forgot-password", apiPrefix), "POST"),
                Pair.of(String.format("%s/nguoi-dung/reset-password", apiPrefix), "POST")
        );

        for (Pair<String, String> byPassToken : byPassTokens) {
            if (request.getServletPath().equals(byPassToken.getFirst())
                    && request.getMethod().equalsIgnoreCase(byPassToken.getSecond())) {
                return true;
            }
        }

        return false;
    }

    private boolean isPublicGetRequest(@NotNull HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getServletPath();
        String favoriteCountPrefix = String.format("%s/bai-dang-yeu-thich/bai-dang/", apiPrefix);

        return isPathOrChild(path, String.format("%s/bai-dang", apiPrefix))
                || isPathOrChild(path, String.format("%s/danhmuc", apiPrefix))
                || isPathOrChild(path, String.format("%s/chi-tiet-can-ho", apiPrefix))
                || isPathOrChild(path, String.format("%s/hinh-anh-bai-dang", apiPrefix))
                || (path.startsWith(favoriteCountPrefix) && path.endsWith("/count"));
    }

    private boolean isPathOrChild(String path, String publicPath) {
        return path.equals(publicPath) || path.startsWith(publicPath + "/");
    }
}
