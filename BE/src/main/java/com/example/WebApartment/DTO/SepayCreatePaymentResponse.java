package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SepayCreatePaymentResponse {
    private String maHoaDon;
    private String noiDungChuyenKhoan;
    private Double soTien;
    private String bankCode;
    private String bankAccount;
    private String accountName;
    private String qrUrl;
    private Integer thoiHanThang;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private List<ChiTietHoaDonDTO> chiTietHoaDon;
}
