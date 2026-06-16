package com.example.WebApartment.DTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentAccountDTO {

    private String maTaiKhoan;
    private String maNguoiDung;
    private String bankCode;
    private String bankAccount;
    private String accountName;
    private Boolean isDefault;
    private String trangThai;
    private LocalDateTime ngayTao;
}
