package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.SepayCreatePaymentRequest;
import com.example.WebApartment.DTO.SepayCreatePaymentResponse;
import com.example.WebApartment.DTO.SepayWebhookRequest;
import com.example.WebApartment.Service.SepayService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/sepay")
@RequiredArgsConstructor
public class SepayController {

    private final SepayService sepayService;

    @Value("${sepay.api-key}")
    private String sepayApiKey;

    @PostMapping("/create-payment")
    public ResponseEntity<SepayCreatePaymentResponse> createPayment(
            @RequestBody SepayCreatePaymentRequest request
    ) {
        return ResponseEntity.ok(sepayService.createPayment(request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> payload
    ) {
        String expected = "Apikey " + sepayApiKey;

        // ===== DEBUG LOG =====
        System.out.println("========== SEPAY WEBHOOK ==========");
        System.out.println("AUTH RECEIVED = [" + authorization + "]");
        System.out.println("AUTH EXPECTED = [" + expected + "]");
        System.out.println("PAYLOAD = " + payload);
        System.out.println("===================================");

        if (authorization == null || !authorization.trim().equals(expected.trim())) {

            System.out.println("❌ API KEY KHÔNG KHỚP");

            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Sai API key SePay"
            ));
        }

        System.out.println("✅ API KEY HỢP LỆ");

        return ResponseEntity.ok(sepayService.handleWebhook(payload));
    }
}