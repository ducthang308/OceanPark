package com.example.WebApartment.Models;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.*;

@Entity
@Table(name = "NguoiDung")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NguoiDung implements UserDetails, OAuth2User {
    @Id
    @Column(name = "maNguoiDung", length = 36)
    private String maNguoiDung;

    @ManyToOne
    @JoinColumn(name = "maVaiTro")
    private VaiTro vaiTro;

    @Column(name = "hoVaTen", length = 100)
    private String hoVaTen;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "diaChi", length = 200)
    private String diaChi;

    @Column(name = "soDienThoai", length = 10, nullable = false)
    private String soDienThoai;

    @Column(name = "trangThai")
    private Boolean trangThai;

    @Column(name = "matKhau", nullable = false)
    private String matKhau;

    @Column(name = "facebookAccount")
    private String facebookAccount;

    @Column(name = "googleAccount")
    private String googleAccount;

    @Column(name = "anhDaiDien")
    private String anhDaiDien;

    // ================== SECURITY ==================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (vaiTro == null || vaiTro.getTenVaiTro() == null) {
            return List.of();
        }

        String tenVaiTro = vaiTro.getTenVaiTro().trim();

        String role;

        switch (tenVaiTro) {
            case "Admin":
                role = "ROLE_ADMIN";
                break;
            case "Người Thuê":
                role = "ROLE_NGUOI_THUE";
                break;
            case "Người Cho Thuê":
                role = "ROLE_NGUOI_CHO_THUE";
                break;
            default:
                role = "ROLE_USER";
        }

        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        return matKhau;
    }

    @Override
    public String getUsername() {
        return soDienThoai; // dùng số điện thoại làm username
    }

    // ================== OAuth2 ==================

    @Override
    public Map<String, Object> getAttributes() {
        return new HashMap<>();
    }

    @Override
    public String getName() {
        return this.hoVaTen;
    }

    // ================== ACCOUNT STATUS ==================

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return trangThai != null ? trangThai : true;
    }
}