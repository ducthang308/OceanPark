package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWithdrawRequest {
    private String maNguoiDung;
    private String bankCode;
    private String bankAccount;
    private String accountName;
    private Double soTien;
}