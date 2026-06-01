package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YeuCauRutTienDTO {
    private String maYeuCauRutTien;
    private String maVi;
    private String maNguoiDung;
    private String tenNguoiDung;
    private String emailNguoiDung;
    private String soDienThoaiNguoiDung;
    private String bankCode;
    private String bankAccount;
    private String accountName;
    private Double soTien;
    private String trangThai;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayXuLy;
}
