package com.example.WebApartment.DTO;

import lombok.*;

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
}