package com.example.WebApartment.Configurations;

import com.example.WebApartment.JWT.JwtFilter;
import com.example.WebApartment.Services.OAuth2.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.http.HttpMethod;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class WebSecurityConfig {

    private final JwtFilter jwtTokenFilter;
    private final CustomOAuth2UserService oauth2UserService;
    private final OAuth2LoginSuccessHandler oauth2LoginSuccessHandler;

    @Value("${api.prefix}")
    private String apiPrefix;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                String.format("%s/nguoi-dung/register", apiPrefix),
                                String.format("%s/nguoi-dung/login", apiPrefix),
                                String.format("%s/sepay/webhook", apiPrefix),
                                String.format("%s/nguoi-dung/forgot-password", apiPrefix),
                                String.format("%s/nguoi-dung/reset-password", apiPrefix)
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                String.format("%s/bai-dang", apiPrefix),
                                String.format("%s/bai-dang/**", apiPrefix),
                                String.format("%s/danhmuc", apiPrefix),
                                String.format("%s/danhmuc/**", apiPrefix),
                                String.format("%s/chi-tiet-can-ho", apiPrefix),
                                String.format("%s/chi-tiet-can-ho/**", apiPrefix),
                                String.format("%s/hinh-anh-bai-dang", apiPrefix),
                                String.format("%s/hinh-anh-bai-dang/**", apiPrefix),
                                String.format("%s/bai-dang-yeu-thich/bai-dang/*/count", apiPrefix)
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.PUT,
                                String.format("%s/bai-dang/*/view", apiPrefix)
                        ).permitAll()
                        .requestMatchers("/ws", "/ws/**").permitAll()
                        .requestMatchers("/ws-chat", "/ws-chat/**").permitAll()
                        .requestMatchers("/ws-chat-sockjs", "/ws-chat-sockjs/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oauth2LoginSuccessHandler)
                )
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistrationBean() {
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(corsFilter());
        bean.setOrder(0);
        return bean;
    }
}
