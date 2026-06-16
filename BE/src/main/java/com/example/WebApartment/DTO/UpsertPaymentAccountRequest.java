package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpsertPaymentAccountRequest {

    private String bankCode;
    private String bankAccount;
    private String accountName;
}
