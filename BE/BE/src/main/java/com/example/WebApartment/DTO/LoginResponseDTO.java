package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private String token;
    private String maNguoiDung;
    private String hoVaTen;
    private String soDienThoai;
    private String email;
    private String vaiTro;
}
