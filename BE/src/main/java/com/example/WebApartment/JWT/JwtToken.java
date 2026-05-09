package com.example.WebApartment.JWT;

import com.example.WebApartment.Exceptions.InvalidParamException;
import com.example.WebApartment.Models.NguoiDung;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Jwts;

import java.security.Key;
import java.util.*;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class JwtToken {

    @Value("${jwt.expiration}")
    private int expiration;

    @Value("${jwt.secretKey}")
    private String secretKey;

    public String generationToken(NguoiDung nguoiDung) throws Exception {
        Map<String, Object> claims = new HashMap<>();

        claims.put("soDienThoai", nguoiDung.getSoDienThoai());

        List<String> roles = List.of(
                "ROLE_" + nguoiDung.getVaiTro().getTenVaiTro().toUpperCase()
        );
        claims.put("roles", roles);

        try {
            return Jwts.builder()
                    .setClaims(claims)
                    .setSubject(nguoiDung.getSoDienThoai())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000L))
                    .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            throw new InvalidParamException("Cannot create jwt token, error: " + e.getMessage());
        }
    }

    private Key getSignInKey() {
        byte[] bytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(bytes);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimResolver) {
        final Claims claims = this.extractAllClaims(token);
        return claimResolver.apply(claims);
    }

    public boolean isTokenExpired(String token) {
        Date expirationDate = this.extractClaim(token, Claims::getExpiration);
        return expirationDate.before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractPhone(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }


    @Value("${jwt.resetExpiration:900}")
    private int resetExpiration;

    private static final String RESET_TOKEN_TYPE = "PASSWORD_RESET";

    public String generateResetPasswordToken(NguoiDung nguoiDung) throws Exception {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", RESET_TOKEN_TYPE);
        claims.put("maNguoiDung", nguoiDung.getMaNguoiDung());
        claims.put("email", nguoiDung.getEmail());

        try {
            return Jwts.builder()
                    .setClaims(claims)
                    .setSubject(nguoiDung.getEmail())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + resetExpiration * 1000L))
                    .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            throw new InvalidParamException("Cannot create reset token: " + e.getMessage());
        }
    }

    public Claims validateResetPasswordToken(String token) throws InvalidParamException {
        try {
            Claims claims = extractAllClaims(token);
            if (!RESET_TOKEN_TYPE.equals(claims.get("type", String.class))) {
                throw new InvalidParamException("Token không phải reset token");
            }
            return claims;
        } catch (InvalidParamException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidParamException("Reset token không hợp lệ hoặc đã hết hạn");
        }
    }

}