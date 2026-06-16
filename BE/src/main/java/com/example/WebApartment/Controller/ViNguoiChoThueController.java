package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Service.PaymentAccountService;
import com.example.WebApartment.Service.ViNguoiChoThueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/vi-nguoi-cho-thue")
@RequiredArgsConstructor
public class ViNguoiChoThueController {

    private final ViNguoiChoThueService service;
    private final PaymentAccountService paymentAccountService;

    @GetMapping("/{maNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<ViNguoiChoThueDTO> getVi(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(service.getByNguoiDung(maNguoiDung));
    }

    @GetMapping("/{maNguoiDung}/giao-dich")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<List<GiaoDichViDTO>> getGiaoDich(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(service.getLichSuGiaoDich(maNguoiDung));
    }

    @GetMapping("/{maNguoiDung}/rut-tien")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<List<YeuCauRutTienDTO>> getYeuCauRutTien(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(service.getYeuCauRutTienByNguoiDung(maNguoiDung));
    }

    @PostMapping("/rut-tien")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<YeuCauRutTienDTO> createWithdraw(
            @RequestBody CreateWithdrawRequest request
    ) {
        return ResponseEntity.ok(service.createWithdrawRequest(request));
    }

    @GetMapping("/rut-tien")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<YeuCauRutTienDTO>> getAllYeuCauRutTien() {
        return ResponseEntity.ok(service.getAllYeuCauRutTien());
    }

    @PutMapping("/rut-tien/{maYeuCauRutTien}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<YeuCauRutTienDTO> approveWithdraw(
            @PathVariable String maYeuCauRutTien
    ) {
        return ResponseEntity.ok(service.approveWithdraw(maYeuCauRutTien));
    }

    @PutMapping("/rut-tien/{maYeuCauRutTien}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<YeuCauRutTienDTO> rejectWithdraw(
            @PathVariable String maYeuCauRutTien
    ) {
        return ResponseEntity.ok(service.rejectWithdraw(maYeuCauRutTien));
    }

    // ==================== PAYMENT ACCOUNTS (TaiKhoanNhanTien) ====================

    /**
     * Lấy danh sách tài khoản nhận tiền của người cho thuê.
     */
    @GetMapping("/{maNguoiDung}/payment-accounts")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<List<PaymentAccountDTO>> getPaymentAccounts(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(paymentAccountService.getPaymentAccountsByUser(maNguoiDung));
    }

    /**
     * Tạo mới hoặc cập nhật tài khoản nhận tiền mặc định của người cho thuê.
     */
    @PutMapping("/{maNguoiDung}/payment-accounts/default")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<PaymentAccountDTO> upsertDefaultPaymentAccount(
            @PathVariable String maNguoiDung,
            @RequestBody UpsertPaymentAccountRequest request
    ) {
        return ResponseEntity.ok(paymentAccountService.upsertDefaultPaymentAccount(maNguoiDung, request));
    }
}
