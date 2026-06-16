package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.PaymentAccountDTO;
import com.example.WebApartment.DTO.UpsertPaymentAccountRequest;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Models.TaiKhoanNhanTien;
import com.example.WebApartment.Repository.NguoiDungRepository;
import com.example.WebApartment.Repository.TaiKhoanNhanTienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentAccountService {

    private final TaiKhoanNhanTienRepository taiKhoanNhanTienRepo;
    private final NguoiDungRepository nguoiDungRepo;

    /**
     * Lấy danh sách tài khoản nhận tiền của một người dùng (landlord).
     */
    public List<PaymentAccountDTO> getPaymentAccountsByUser(String maNguoiDung) {
        return taiKhoanNhanTienRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Tạo mới hoặc cập nhật tài khoản nhận tiền mặc định của landlord.
     * Chỉ cho phép 1 tài khoản mặc định ACTIVE duy nhất.
     */
    @Transactional
    public PaymentAccountDTO upsertDefaultPaymentAccount(
            String maNguoiDung,
            UpsertPaymentAccountRequest request
    ) {
        if (request == null) {
            throw new RuntimeException("Thông tin tài khoản nhận tiền không hợp lệ");
        }

        String bankCode = request.getBankCode() != null ? request.getBankCode().trim() : "";
        String bankAccount = request.getBankAccount() != null ? request.getBankAccount().trim() : "";
        String accountName = request.getAccountName() != null ? request.getAccountName().trim() : "";

        if (bankCode.isBlank() || bankAccount.isBlank() || accountName.isBlank()) {
            throw new RuntimeException("Vui lòng nhập đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản");
        }

        NguoiDung nguoiDung = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Tìm tài khoản mặc định hiện tại (nếu có)
        TaiKhoanNhanTien existing = taiKhoanNhanTienRepo
                .findByNguoiDung_MaNguoiDungAndIsDefaultTrueAndTrangThai(maNguoiDung, "ACTIVE")
                .orElse(null);

        if (existing != null) {
            // Cập nhật tài khoản hiện có
            existing.setBankCode(bankCode);
            existing.setBankAccount(bankAccount);
            existing.setAccountName(accountName);
            return toDto(taiKhoanNhanTienRepo.save(existing));
        }

        // Tạo mới
        TaiKhoanNhanTien newAccount = TaiKhoanNhanTien.builder()
                .maTaiKhoan(generateId())
                .nguoiDung(nguoiDung)
                .bankCode(bankCode)
                .bankAccount(bankAccount)
                .accountName(accountName)
                .isDefault(true)
                .trangThai("ACTIVE")
                .ngayTao(LocalDateTime.now())
                .build();

        return toDto(taiKhoanNhanTienRepo.save(newAccount));
    }

    private PaymentAccountDTO toDto(TaiKhoanNhanTien entity) {
        return PaymentAccountDTO.builder()
                .maTaiKhoan(entity.getMaTaiKhoan())
                .maNguoiDung(entity.getNguoiDung().getMaNguoiDung())
                .bankCode(entity.getBankCode())
                .bankAccount(entity.getBankAccount())
                .accountName(entity.getAccountName())
                .isDefault(entity.getIsDefault())
                .trangThai(entity.getTrangThai())
                .ngayTao(entity.getNgayTao())
                .build();
    }

    private String generateId() {
        return "TK" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }
}
