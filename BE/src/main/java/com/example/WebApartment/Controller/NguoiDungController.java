package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.JWT.JwtToken;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Service.NguoiDungService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/nguoi-dung")
@RequiredArgsConstructor
public class NguoiDungController {

    private final NguoiDungService nguoiDungService;
    private final PasswordEncoder passwordEncoder;
    private final JwtToken jwtToken;

    @PostMapping("/register")
    public ResponseEntity<NguoiDungDTO> register(@RequestBody NguoiDungDTO dto) {
        return ResponseEntity.status(201).body(nguoiDungService.create(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginDTO dto) throws Exception {
        NguoiDung nguoiDung = nguoiDungService.findBySoDienThoai(dto.getSoDienThoai());

        if (nguoiDung == null) {
            throw new BadCredentialsException("Số điện thoại hoặc mật khẩu không đúng");
        }

        if (!passwordEncoder.matches(dto.getMatKhau(), nguoiDung.getMatKhau())) {
            throw new BadCredentialsException("Số điện thoại hoặc mật khẩu không đúng");
        }

        if (nguoiDung.getTrangThai() != null && !nguoiDung.getTrangThai()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        String token = jwtToken.generationToken(nguoiDung);

        return ResponseEntity.ok(
                LoginResponseDTO.builder()
                        .token(token)
                        .maNguoiDung(nguoiDung.getMaNguoiDung())
                        .hoVaTen(nguoiDung.getHoVaTen())
                        .soDienThoai(nguoiDung.getSoDienThoai())
                        .email(nguoiDung.getEmail())
                        .vaiTro(nguoiDung.getVaiTro() != null ? nguoiDung.getVaiTro().getTenVaiTro() : null)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<List<NguoiDungDTO>> getAll() {
        return ResponseEntity.ok(nguoiDungService.getAll());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDTO> me(Authentication authentication) {
        NguoiDung nguoiDung = (NguoiDung) authentication.getPrincipal();

        return ResponseEntity.ok(
                AuthUserDTO.builder()
                        .maNguoiDung(nguoiDung.getMaNguoiDung())
                        .hoVaTen(nguoiDung.getHoVaTen())
                        .soDienThoai(nguoiDung.getSoDienThoai())
                        .email(nguoiDung.getEmail())
                        .maVaiTro(nguoiDung.getVaiTro() != null ? nguoiDung.getVaiTro().getMaVaiTro() : null)
                        .vaiTro(nguoiDung.getVaiTro() != null ? nguoiDung.getVaiTro().getTenVaiTro() : null)
                        .anhDaiDien(nguoiDung.getAnhDaiDien())
                        .build()
        );
    }

    @GetMapping("/{maNguoiDung}")
    public ResponseEntity<NguoiDungDTO> getById(@PathVariable String maNguoiDung) {
        return ResponseEntity.ok(nguoiDungService.getById(maNguoiDung));
    }

    @PostMapping
    public ResponseEntity<NguoiDungDTO> create(@RequestBody NguoiDungDTO dto) {
        return ResponseEntity.status(201).body(nguoiDungService.create(dto));
    }

    @PutMapping("/{maNguoiDung}")
    public ResponseEntity<NguoiDungDTO> update(@PathVariable String maNguoiDung,
                                               @RequestBody NguoiDungDTO dto) {
        return ResponseEntity.ok(nguoiDungService.update(maNguoiDung, dto));
    }

    @DeleteMapping("/{maNguoiDung}")
    public ResponseEntity<Void> delete(@PathVariable String maNguoiDung) {
        nguoiDungService.delete(maNguoiDung);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO dto) {
        nguoiDungService.forgotPassword(dto.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu"
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO dto) {
        nguoiDungService.resetPassword(dto.getToken(), dto.getMatKhauMoi());
        return ResponseEntity.ok(Map.of(
                "message", "Đổi mật khẩu thành công. Vui lòng đăng nhập lại"
        ));
    }

}
