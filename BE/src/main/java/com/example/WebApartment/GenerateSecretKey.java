package com.example.WebApartment;

import io.jsonwebtoken.io.Encoders;

import java.security.SecureRandom;

public class GenerateSecretKey {
    public static void main(String[] args) {
        SecureRandom random = new SecureRandom();
        byte[] keyBytes = new byte[32]; // 256-bit
        random.nextBytes(keyBytes);

        String base64Key = Encoders.BASE64.encode(keyBytes);
        System.out.println("Secret Key: " + base64Key);
    }
}