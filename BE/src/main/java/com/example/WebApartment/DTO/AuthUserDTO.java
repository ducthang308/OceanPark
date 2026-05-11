package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthUserDTO {
    private String maNguoiDung;
    private String hoVaTen;
    private String soDienThoai;
    private String email;
    private String maVaiTro;
    private String vaiTro;
    private String anhDaiDien;
}
