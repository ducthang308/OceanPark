package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NguoiDungDTO {

    private String maNguoiDung;
    private String maVaiTro;

    private String hoVaTen;
    private String email;
    private String diaChi;
    private String soDienThoai;
    private Boolean trangThai;
    private String matKhau;
    private String facebookAccount;
    private String googleAccount;
    private String anhDaiDien;
}