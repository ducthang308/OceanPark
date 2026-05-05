package com.example.WebApartment.Configurations;

<<<<<<< HEAD
import com.example.WebApartment.Repository.NguoiDungRepository;
=======
//import com.example.WebApartment.Repositories.UserRepository;
>>>>>>> b677cefbcc96b6702ecf1b31ca9056bb27815150
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
<<<<<<< HEAD
=======
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
>>>>>>> b677cefbcc96b6702ecf1b31ca9056bb27815150
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
<<<<<<< HEAD
=======
import org.springframework.security.web.SecurityFilterChain;
>>>>>>> b677cefbcc96b6702ecf1b31ca9056bb27815150

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

<<<<<<< HEAD
    private final NguoiDungRepository nguoiDungRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return soDienThoai -> {
            var nguoiDung = nguoiDungRepository.findBySoDienThoai(soDienThoai);

            if (nguoiDung == null) {
                throw new UsernameNotFoundException(
                        "Không tìm thấy người dùng với số điện thoại: " + soDienThoai
                );
            }

            return nguoiDung;
        };
    }

=======
//    private final UserRepository userRepository;

    // ================= USER DETAILS =================
//    @Bean
//    public UserDetailsService userDetailsService() {
//        return phoneNumber -> userRepository
//                .findByPhone(phoneNumber)
//                .orElseThrow(() ->
//                        new UsernameNotFoundException(
//                                "Cannot find user with phone: " + phoneNumber
//                        )
//                );
//    }

    // ================= PASSWORD ENCODER =================
>>>>>>> b677cefbcc96b6702ecf1b31ca9056bb27815150
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

<<<<<<< HEAD
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
=======
    // ================= AUTH PROVIDER =================
//    @Bean
//    public AuthenticationProvider authenticationProvider() {
//        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
//
//        provider.setUserDetailsService(userDetailsService());
//        provider.setPasswordEncoder(passwordEncoder());
//
//        return provider;
//    }

    // ================= AUTH MANAGER =================
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    // ================= SECURITY FILTER CHAIN =================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // cho test trước, mở toàn bộ API
                        .anyRequest().permitAll()
                );

        return http.build();
    }
>>>>>>> b677cefbcc96b6702ecf1b31ca9056bb27815150
}