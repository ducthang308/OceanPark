package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.SepayCreatePaymentRequest;
import com.example.WebApartment.DTO.SepayCreatePaymentResponse;
import com.example.WebApartment.DTO.SepayWebhookRequest;
import com.example.WebApartment.Models.*;
import com.example.WebApartment.Repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SepayService {

    private final HoaDonRepository hoaDonRepository;
    private final GiaoDichRepository giaoDichRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;
    private final PhuongThucThanhToanRepository phuongThucThanhToanRepository;
    private final ObjectMapper objectMapper;

    @Value("${sepay.bank-code}")
    private String bankCode;

    @Value("${sepay.bank-account}")
    private String bankAccount;

    @Value("${sepay.account-name}")
    private String accountName;

    @Transactional
    public SepayCreatePaymentResponse createPayment(SepayCreatePaymentRequest request) {
        validateCreatePayment(request);

        NguoiDung nguoiDung = nguoiDungRepository.findById(request.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        BaiDang baiDang = null;
        if (request.getMaBaiDang() != null && !request.getMaBaiDang().isBlank()) {
            baiDang = baiDangRepository.findById(request.getMaBaiDang())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        }

        String maHoaDon = generateMaHoaDon();
        String noiDungChuyenKhoan = maHoaDon;

        HoaDon hoaDon = HoaDon.builder()
                .maHoaDon(maHoaDon)
                .nguoiDung(nguoiDung)
                .baiDang(baiDang)
                .loaiHoaDon(request.getLoaiHoaDon())
                .soTien(request.getSoTien())
                .trangThaiThanhToan("PENDING")
                .trangThaiHieuLuc("CHUA_HIEU_LUC")
                .noiDungChuyenKhoan(noiDungChuyenKhoan)
                .ghiChu(request.getGhiChu())
                .ngayTao(LocalDateTime.now())
                .build();

        hoaDonRepository.save(hoaDon);

        PhuongThucThanhToan phuongThuc = phuongThucThanhToanRepository.findByProvider("SEPAY")
                .orElseThrow(() -> new RuntimeException("Chưa có phương thức thanh toán SEPAY"));

        GiaoDich giaoDich = GiaoDich.builder()
                .maGiaoDich(generateMaGiaoDich())
                .hoaDon(hoaDon)
                .nguoiDung(nguoiDung)
                .phuongThucThanhToan(phuongThuc)
                .soTien(request.getSoTien())
                .trangThai("PENDING")
                .provider("SEPAY")
                .providerTxnRef(noiDungChuyenKhoan)
                .orderInfo(noiDungChuyenKhoan)
                .noiDung("Tạo giao dịch SePay chờ thanh toán")
                .ngayTao(LocalDateTime.now())
                .build();

        giaoDichRepository.save(giaoDich);

        String qrUrl = buildVietQrUrl(request.getSoTien(), noiDungChuyenKhoan);

        return SepayCreatePaymentResponse.builder()
                .maHoaDon(maHoaDon)
                .noiDungChuyenKhoan(noiDungChuyenKhoan)
                .soTien(request.getSoTien())
                .bankCode(bankCode)
                .bankAccount(bankAccount)
                .accountName(accountName)
                .qrUrl(qrUrl)
                .build();
    }

    @Transactional
    public Map<String, Object> handleWebhook(SepayWebhookRequest request) {
        if (request == null) {
            throw new RuntimeException("Webhook không hợp lệ");
        }

        if (request.getTransferAmount() == null || request.getTransferAmount() <= 0) {
            return Map.of("success", false, "message", "Không phải giao dịch tiền vào hợp lệ");
        }

        String transactionNo = request.getReferenceCode() != null
                ? request.getReferenceCode()
                : String.valueOf(request.getId());

        if (transactionNo != null && giaoDichRepository.existsByProviderTransactionNo(transactionNo)) {
            return Map.of("success", true, "message", "Webhook đã được xử lý trước đó");
        }

        String content = firstNotBlank(request.getContent(), request.getDescription(), request.getCode());

        HoaDon hoaDon = findHoaDonFromContent(content);

        if (hoaDon == null) {
            return Map.of("success", false, "message", "Không tìm thấy hóa đơn trong nội dung chuyển khoản");
        }

        if ("SUCCESS".equalsIgnoreCase(hoaDon.getTrangThaiThanhToan())) {
            return Map.of("success", true, "message", "Hóa đơn đã thanh toán trước đó");
        }

        if (request.getTransferAmount() < hoaDon.getSoTien()) {
            saveFailedGiaoDich(hoaDon, request, "Số tiền chuyển khoản không đủ");
            return Map.of("success", false, "message", "Số tiền chuyển khoản không đủ");
        }

        LocalDateTime now = LocalDateTime.now();

        hoaDon.setTrangThaiThanhToan("SUCCESS");
        hoaDon.setTrangThaiHieuLuc("DANG_HIEU_LUC");
        hoaDon.setNgayThanhToan(now);

        if (hoaDon.getNgayBatDau() == null) {
            hoaDon.setNgayBatDau(now);
        }

        if (hoaDon.getNgayKetThuc() == null) {
            hoaDon.setNgayKetThuc(now.plusMonths(1));
        }

        hoaDonRepository.save(hoaDon);

        if (hoaDon.getBaiDang() != null) {
            BaiDang baiDang = hoaDon.getBaiDang();

            if ("DANG_BAI".equalsIgnoreCase(hoaDon.getLoaiHoaDon())) {
                baiDang.setTrangThai("ACTIVE");
            }

            if ("THUE_CAN_HO".equalsIgnoreCase(hoaDon.getLoaiHoaDon())) {
                baiDang.setTrangThai("DA_THUE");
            }

            baiDangRepository.save(baiDang);
        }

        PhuongThucThanhToan phuongThuc = phuongThucThanhToanRepository.findByProvider("SEPAY")
                .orElseThrow(() -> new RuntimeException("Chưa có phương thức thanh toán SEPAY"));

        GiaoDich giaoDich = GiaoDich.builder()
                .maGiaoDich(generateMaGiaoDich())
                .hoaDon(hoaDon)
                .nguoiDung(hoaDon.getNguoiDung())
                .phuongThucThanhToan(phuongThuc)
                .soTien(request.getTransferAmount())
                .trangThai("SUCCESS")
                .provider("SEPAY")
                .providerTxnRef(hoaDon.getNoiDungChuyenKhoan())
                .providerTransactionNo(transactionNo)
                .providerTransactionStatus("SUCCESS")
                .bankCode(request.getGateway())
                .bankAccount(request.getAccountNumber())
                .payDate(request.getTransactionDate())
                .orderInfo(content)
                .rawData(toJson(request))
                .noiDung("Thanh toán SePay thành công")
                .ngayTao(now)
                .build();

        giaoDichRepository.save(giaoDich);

        return Map.of(
                "success", true,
                "message", "Thanh toán thành công",
                "maHoaDon", hoaDon.getMaHoaDon()
        );
    }

    private HoaDon findHoaDonFromContent(String content) {
        if (content == null || content.isBlank()) return null;

        return hoaDonRepository.findAll()
                .stream()
                .filter(hd -> hd.getNoiDungChuyenKhoan() != null
                        && content.toUpperCase().contains(hd.getNoiDungChuyenKhoan().toUpperCase()))
                .findFirst()
                .orElse(null);
    }

    private void saveFailedGiaoDich(HoaDon hoaDon, SepayWebhookRequest request, String reason) {
        PhuongThucThanhToan phuongThuc = phuongThucThanhToanRepository.findByProvider("SEPAY")
                .orElse(null);

        GiaoDich giaoDich = GiaoDich.builder()
                .maGiaoDich(generateMaGiaoDich())
                .hoaDon(hoaDon)
                .nguoiDung(hoaDon.getNguoiDung())
                .phuongThucThanhToan(phuongThuc)
                .soTien(request.getTransferAmount())
                .trangThai("FAILED")
                .provider("SEPAY")
                .providerTxnRef(hoaDon.getNoiDungChuyenKhoan())
                .providerTransactionNo(request.getReferenceCode())
                .providerTransactionStatus("FAILED")
                .bankCode(request.getGateway())
                .bankAccount(request.getAccountNumber())
                .payDate(request.getTransactionDate())
                .orderInfo(firstNotBlank(request.getContent(), request.getDescription(), request.getCode()))
                .rawData(toJson(request))
                .noiDung(reason)
                .ngayTao(LocalDateTime.now())
                .build();

        giaoDichRepository.save(giaoDich);
    }

    private String buildVietQrUrl(Double amount, String content) {
        String encodedContent = URLEncoder.encode(content, StandardCharsets.UTF_8);
        String encodedName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);

        return "https://img.vietqr.io/image/"
                + bankCode + "-"
                + bankAccount
                + "-compact2.png"
                + "?amount=" + amount.longValue()
                + "&addInfo=" + encodedContent
                + "&accountName=" + encodedName;
    }

    private void validateCreatePayment(SepayCreatePaymentRequest request) {
        if (request == null) {
            throw new RuntimeException("Dữ liệu thanh toán không hợp lệ");
        }

        if (request.getMaNguoiDung() == null || request.getMaNguoiDung().isBlank()) {
            throw new RuntimeException("Mã người dùng không được để trống");
        }

        if (request.getLoaiHoaDon() == null || request.getLoaiHoaDon().isBlank()) {
            throw new RuntimeException("Loại hóa đơn không được để trống");
        }

        if (!"DANG_BAI".equalsIgnoreCase(request.getLoaiHoaDon())
                && !"THUE_CAN_HO".equalsIgnoreCase(request.getLoaiHoaDon())) {
            throw new RuntimeException("Loại hóa đơn không hợp lệ");
        }

        if (request.getSoTien() == null || request.getSoTien() <= 0) {
            throw new RuntimeException("Số tiền không hợp lệ");
        }

        if (request.getMaBaiDang() == null || request.getMaBaiDang().isBlank()) {
            throw new RuntimeException("Mã bài đăng không được để trống");
        }
    }

    private String generateMaHoaDon() {
        return "HD" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String generateMaGiaoDich() {
        return "GD" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String toJson(Object data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return "";
        }
    }

    private String firstNotBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}