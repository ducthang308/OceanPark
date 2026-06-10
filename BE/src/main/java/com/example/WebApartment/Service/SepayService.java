package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.ChiTietHoaDonDTO;
import com.example.WebApartment.DTO.SepayCreatePaymentRequest;
import com.example.WebApartment.DTO.SepayCreatePaymentResponse;
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
import java.util.List;
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
    private final GoiDangBaiRepository goiDangBaiRepository;
    private final ChiTietCanHoRepository chiTietCanHoRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;
    private final ObjectMapper objectMapper;
    private final ViNguoiChoThueService viNguoiChoThueService;
    private final EmailService emailService;

    @Value("${sepay.bank-code}")
    private String bankCode;

    @Value("${sepay.bank-account}")
    private String bankAccount;

    @Value("${sepay.account-name}")
    private String accountName;

    private static final double GIA_GOI_DANG_BAI_TEST = 50000D;
    private static final int DEFAULT_RENTAL_TERM_MONTHS = 6;
    private static final List<Integer> ALLOWED_RENTAL_TERM_MONTHS = List.of(3, 6, 12);

    @Transactional
    public SepayCreatePaymentResponse createPayment(SepayCreatePaymentRequest request) {
        validateCreatePayment(request);

        NguoiDung nguoiDung = nguoiDungRepository.findById(request.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        BaiDang baiDang = null;
        GoiDangBai goiDangBai = null;
        List<RentPaymentLine> rentLines = List.of();
        LocalDateTime now = LocalDateTime.now();
        Integer thoiHanThang = null;
        LocalDateTime ngayBatDau = null;
        LocalDateTime ngayKetThuc = null;

        double soTienThanhToan = request.getSoTien() != null ? request.getSoTien() : 0D;

        if ("DANG_BAI".equalsIgnoreCase(request.getLoaiHoaDon())) {
            soTienThanhToan = GIA_GOI_DANG_BAI_TEST;

            goiDangBai = GoiDangBai.builder()
                    .maGoiDangBai(generateMaGoiDangBai())
                    .nguoiDung(nguoiDung)
                    .tenGoi("Gói đăng bài 1 tháng")
                    .giaTien(GIA_GOI_DANG_BAI_TEST)
                    .trangThai("PENDING")
                    .ngayTao(now)
                    .build();

            goiDangBaiRepository.save(goiDangBai);
        }

        if ("THUE_CAN_HO".equalsIgnoreCase(request.getLoaiHoaDon())) {
            rentLines = buildRentPaymentLines(request);
            baiDang = rentLines.get(0).baiDang();
            soTienThanhToan = rentLines.stream().mapToDouble(RentPaymentLine::thanhTien).sum();
            thoiHanThang = resolveRequestedRentalTermMonths(request);
            ngayBatDau = now;
            ngayKetThuc = now.plusMonths(thoiHanThang);
        }

        String maHoaDon = generateMaHoaDon();
        String noiDungChuyenKhoan = maHoaDon;

        HoaDon hoaDon = HoaDon.builder()
                .maHoaDon(maHoaDon)
                .nguoiDung(nguoiDung)
                .baiDang(baiDang)
                .goiDangBai(goiDangBai)
                .loaiHoaDon(request.getLoaiHoaDon().toUpperCase())
                .soTien(soTienThanhToan)
                .trangThaiThanhToan("PENDING")
                .trangThaiHieuLuc("CHUA_HIEU_LUC")
                .ngayBatDau(ngayBatDau)
                .ngayKetThuc(ngayKetThuc)
                .noiDungChuyenKhoan(noiDungChuyenKhoan)
                .ghiChu(request.getGhiChu())
                .ngayTao(now)
                .build();

        hoaDonRepository.save(hoaDon);

        if (!rentLines.isEmpty()) {
            saveRentInvoiceDetails(hoaDon, rentLines);
        }

        PhuongThucThanhToan phuongThuc = phuongThucThanhToanRepository.findByProvider("SEPAY")
                .orElseThrow(() -> new RuntimeException("Chưa có phương thức thanh toán SEPAY"));

        GiaoDich giaoDich = GiaoDich.builder()
                .maGiaoDich(generateMaGiaoDich())
                .hoaDon(hoaDon)
                .nguoiDung(nguoiDung)
                .phuongThucThanhToan(phuongThuc)
                .soTien(soTienThanhToan)
                .trangThai("PENDING")
                .provider("SEPAY")
                .providerTxnRef(noiDungChuyenKhoan)
                .orderInfo(noiDungChuyenKhoan)
                .noiDung("Tạo giao dịch SePay chờ thanh toán")
                .ngayTao(now)
                .build();

        giaoDichRepository.save(giaoDich);

        String qrUrl = buildVietQrUrl(soTienThanhToan, noiDungChuyenKhoan);

        return SepayCreatePaymentResponse.builder()
                .maHoaDon(maHoaDon)
                .noiDungChuyenKhoan(noiDungChuyenKhoan)
                .soTien(soTienThanhToan)
                .bankCode(bankCode)
                .bankAccount(bankAccount)
                .accountName(accountName)
                .qrUrl(qrUrl)
                .thoiHanThang(thoiHanThang)
                .ngayBatDau(ngayBatDau)
                .ngayKetThuc(ngayKetThuc)
                .chiTietHoaDon(
                        rentLines.stream()
                                .map(line -> toChiTietHoaDonDto(hoaDon.getMaHoaDon(), line))
                                .toList()
                )
                .build();
    }

    @Transactional
    public Map<String, Object> handleWebhook(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return Map.of("success", false, "message", "Webhook rỗng");
        }

        String content = firstNotBlank(
                getString(payload, "content"),
                getString(payload, "description"),
                getString(payload, "code"),
                getString(payload, "transaction_content")
        );
        Double transferAmount = getDouble(payload, "transferAmount");
        if (transferAmount == null) transferAmount = getDouble(payload, "transfer_amount");
        if (transferAmount == null) transferAmount = getDouble(payload, "amount");

        String transactionNo = firstNotBlank(
                getString(payload, "referenceCode"),
                getString(payload, "reference_code"),
                getString(payload, "id")
        );

        if (transferAmount == null || transferAmount <= 0) {
            return Map.of("success", false, "message", "Không phải giao dịch tiền vào hợp lệ");
        }

        if (transactionNo != null && !transactionNo.isBlank()
                && giaoDichRepository.existsByProviderTransactionNo(transactionNo)) {
            return Map.of("success", true, "message", "Webhook đã được xử lý trước đó");
        }

        HoaDon hoaDon = findHoaDonFromContent(content);

        if (hoaDon == null) {
            return Map.of(
                    "success", false,
                    "message", "Không tìm thấy hóa đơn trong nội dung chuyển khoản",
                    "content", content
            );
        }

        if ("SUCCESS".equalsIgnoreCase(hoaDon.getTrangThaiThanhToan())) {
            return Map.of("success", true, "message", "Hóa đơn đã thanh toán trước đó");
        }

        if (transferAmount < hoaDon.getSoTien()) {
            saveWebhookGiaoDichFromMap(
                    hoaDon,
                    payload,
                    transferAmount,
                    transactionNo,
                    "FAILED",
                    "Số tiền chuyển khoản không đủ",
                    LocalDateTime.now()
            );
            return Map.of("success", false, "message", "Số tiền chuyển khoản không đủ");
        }

        LocalDateTime now = LocalDateTime.now();
        int effectiveMonths = "THUE_CAN_HO".equalsIgnoreCase(hoaDon.getLoaiHoaDon())
                ? resolvePersistedRentalTermMonths(hoaDon)
                : 1;

        hoaDon.setTrangThaiThanhToan("SUCCESS");
        hoaDon.setTrangThaiHieuLuc("DANG_HIEU_LUC");
        hoaDon.setNgayThanhToan(now);
        hoaDon.setNgayBatDau(now);
        hoaDon.setNgayKetThuc(now.plusMonths(effectiveMonths));
        hoaDonRepository.save(hoaDon);

        if ("DANG_BAI".equalsIgnoreCase(hoaDon.getLoaiHoaDon())) {
            GoiDangBai goi = hoaDon.getGoiDangBai();

            if (goi != null) {
                goi.setTrangThai("ACTIVE");
                goi.setNgayBatDau(now);
                goi.setNgayKetThuc(now.plusMonths(1));
                goiDangBaiRepository.save(goi);
            }

            emailService.sendPaymentSuccessEmail(
                    hoaDon,
                    List.of()
            );
        }

        if ("THUE_CAN_HO".equalsIgnoreCase(hoaDon.getLoaiHoaDon())) {
            processSuccessfulRentInvoice(hoaDon);
        }

        saveWebhookGiaoDichFromMap(
                hoaDon,
                payload,
                transferAmount,
                transactionNo,
                "SUCCESS",
                "Thanh toán SePay thành công",
                now
        );

        sendPaymentSuccessEmailSafely(hoaDon);

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

    private void validateCreatePayment(SepayCreatePaymentRequest request) {
        if (request == null) throw new RuntimeException("Dữ liệu thanh toán không hợp lệ");

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

        if ("THUE_CAN_HO".equalsIgnoreCase(request.getLoaiHoaDon())) {
            boolean hasLegacyPost = request.getMaBaiDang() != null && !request.getMaBaiDang().isBlank();
            boolean hasItems = request.getChiTietHoaDon() != null && !request.getChiTietHoaDon().isEmpty();

            if (!hasLegacyPost && !hasItems) {
                throw new RuntimeException("Danh sách căn hộ thuê không được để trống");
            }

            resolveRequestedRentalTermMonths(request);
        }
    }

    private int resolveRequestedRentalTermMonths(SepayCreatePaymentRequest request) {
        Integer thoiHanThang = request.getThoiHanThang();

        if (thoiHanThang == null) {
            return DEFAULT_RENTAL_TERM_MONTHS;
        }

        if (!ALLOWED_RENTAL_TERM_MONTHS.contains(thoiHanThang)) {
            throw new RuntimeException("Thời hạn thuê chỉ hỗ trợ 3, 6 hoặc 12 tháng");
        }

        return thoiHanThang;
    }

    private int resolvePersistedRentalTermMonths(HoaDon hoaDon) {
        LocalDateTime start = hoaDon.getNgayBatDau();
        LocalDateTime end = hoaDon.getNgayKetThuc();

        if (start == null || end == null || !end.isAfter(start)) {
            return DEFAULT_RENTAL_TERM_MONTHS;
        }

        int months = (end.getYear() - start.getYear()) * 12
                + end.getMonthValue() - start.getMonthValue();

        return months > 0 ? months : DEFAULT_RENTAL_TERM_MONTHS;
    }

    private List<RentPaymentLine> buildRentPaymentLines(SepayCreatePaymentRequest request) {
        List<ChiTietHoaDonDTO> requestedItems = request.getChiTietHoaDon();

        if (requestedItems == null || requestedItems.isEmpty()) {
            requestedItems = List.of(ChiTietHoaDonDTO.builder()
                    .maBaiDang(request.getMaBaiDang())
                    .soLuong(1)
                    .donGia(request.getSoTien())
                    .ghiChu(request.getGhiChu())
                    .build());
        }

        return requestedItems.stream().map(item -> {
            if (item.getMaBaiDang() == null || item.getMaBaiDang().isBlank()) {
                throw new RuntimeException("Mã bài đăng trong chi tiết hóa đơn không được để trống");
            }

            BaiDang itemBaiDang = baiDangRepository.findById(item.getMaBaiDang())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

            ChiTietCanHo canHo = chiTietCanHoRepository.findByBaiDang_MaBaiDang(item.getMaBaiDang())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết căn hộ"));

            int soLuong = item.getSoLuong() != null && item.getSoLuong() > 0 ? item.getSoLuong() : 1;
            int soLuongTrong = canHo.getSoLuongTrong() != null ? canHo.getSoLuongTrong() : 1;

            if (soLuongTrong < soLuong) {
                throw new RuntimeException("Căn hộ " + item.getMaBaiDang()
                        + " chỉ còn " + soLuongTrong + " phòng trống");
            }

            double donGia = canHo.getGia() != null && canHo.getGia() > 0
                    ? canHo.getGia()
                    : item.getDonGia() != null ? item.getDonGia() : 0D;

            if (donGia <= 0) {
                throw new RuntimeException("Đơn giá căn hộ " + item.getMaBaiDang() + " không hợp lệ");
            }

            return new RentPaymentLine(
                    itemBaiDang,
                    soLuong,
                    donGia,
                    donGia * soLuong,
                    item.getGhiChu()
            );
        }).toList();
    }

    private void saveRentInvoiceDetails(HoaDon hoaDon, List<RentPaymentLine> rentLines) {
        rentLines.forEach(line -> {
            ChiTietHoaDon detail = ChiTietHoaDon.builder()
                    .maChiTietHoaDon(generateMaChiTietHoaDon())
                    .hoaDon(hoaDon)
                    .baiDang(line.baiDang())
                    .soLuong(line.soLuong())
                    .donGia(line.donGia())
                    .thanhTien(line.thanhTien())
                    .ghiChu(line.ghiChu())
                    .build();

            chiTietHoaDonRepository.save(detail);
        });
    }

    private void processSuccessfulRentInvoice(HoaDon hoaDon) {
        List<ChiTietHoaDon> details = chiTietHoaDonRepository.findByHoaDon_MaHoaDon(hoaDon.getMaHoaDon());

        if (details.isEmpty() && hoaDon.getBaiDang() != null) {
            processSuccessfulRentLine(hoaDon, hoaDon.getBaiDang(), 1, hoaDon.getSoTien());
            return;
        }

        details.forEach(detail -> {
            BaiDang baiDang = detail.getBaiDang();
            if (baiDang == null) return;

            int soLuong = detail.getSoLuong() != null && detail.getSoLuong() > 0 ? detail.getSoLuong() : 1;
            double thanhTien = detail.getThanhTien() != null
                    ? detail.getThanhTien()
                    : (detail.getDonGia() != null ? detail.getDonGia() * soLuong : 0D);

            processSuccessfulRentLine(hoaDon, baiDang, soLuong, thanhTien);
        });
    }

    private void processSuccessfulRentLine(
            HoaDon hoaDon,
            BaiDang baiDang,
            int soLuong,
            double thanhTien
    ) {
        ChiTietCanHo canHo = chiTietCanHoRepository
                .findForUpdateByBaiDangMaBaiDang(baiDang.getMaBaiDang())
                .orElse(null);

        if (canHo != null) {
            int hienCon = canHo.getSoLuongTrong() != null ? canHo.getSoLuongTrong() : 0;
            int soLuongConLai = Math.max(0, hienCon - soLuong);

            canHo.setSoLuongTrong(soLuongConLai);
            chiTietCanHoRepository.save(canHo);

            if (soLuongConLai <= 0) {
                baiDang.setTrangThai("DA_THUE");
                baiDangRepository.save(baiDang);
            }
        } else {
            baiDang.setTrangThai("DA_THUE");
            baiDangRepository.save(baiDang);
        }

        if (baiDang.getNguoiDung() != null) {
            viNguoiChoThueService.congDoanhThuChoNguoiChoThue(
                    baiDang.getNguoiDung().getMaNguoiDung(),
                    hoaDon.getMaHoaDon(),
                    thanhTien
            );
        }
    }

    private ChiTietHoaDonDTO toChiTietHoaDonDto(String maHoaDon, RentPaymentLine line) {
        return ChiTietHoaDonDTO.builder()
                .maHoaDon(maHoaDon)
                .maBaiDang(line.baiDang().getMaBaiDang())
                .soLuong(line.soLuong())
                .donGia(line.donGia())
                .thanhTien(line.thanhTien())
                .ghiChu(line.ghiChu())
                .tieuDeBaiDang(line.baiDang().getTieuDe())
                .build();
    }

    private void sendPaymentSuccessEmailSafely(HoaDon hoaDon) {
        try {

            List<ChiTietHoaDon> details =
                    chiTietHoaDonRepository.findByHoaDon_MaHoaDon(
                            hoaDon.getMaHoaDon()
                    );

            emailService.sendPaymentSuccessEmail(
                    hoaDon,
                    details
            );

            if ("THUE_CAN_HO".equalsIgnoreCase(hoaDon.getLoaiHoaDon())) {
                emailService.sendLandlordRentSuccessEmails(
                        hoaDon,
                        details
                );
            }

        } catch (Exception e) {
            System.err.println(
                    "Không gửi được email thanh toán thành công cho hóa đơn "
                            + hoaDon.getMaHoaDon()
                            + ": "
                            + e.getMessage()
            );
        }
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

    private String generateMaHoaDon() {
        return "HD" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String generateMaGiaoDich() {
        return "GD" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String generateMaChiTietHoaDon() {
        return "CTHD" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private String generateMaGoiDangBai() {
        return "GDB" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
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
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private String getString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private Double getDouble(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) return null;

        try {
            if (value instanceof Number number) {
                return number.doubleValue();
            }

            String str = String.valueOf(value)
                    .replace(",", "")
                    .replace("đ", "")
                    .trim();

            return Double.parseDouble(str);
        } catch (Exception e) {
            return null;
        }
    }
    private record RentPaymentLine(
            BaiDang baiDang,
            int soLuong,
            double donGia,
            double thanhTien,
            String ghiChu
    ) {
    }

    private void saveWebhookGiaoDichFromMap(
            HoaDon hoaDon,
            Map<String, Object> payload,
            Double transferAmount,
            String transactionNo,
            String status,
            String message,
            LocalDateTime timestamp
    ) {
        PhuongThucThanhToan phuongThuc = phuongThucThanhToanRepository.findByProvider("SEPAY")
                .orElseThrow(() -> new RuntimeException("Chưa có phương thức thanh toán SEPAY"));

        String content = firstNotBlank(
                getString(payload, "content"),
                getString(payload, "description"),
                getString(payload, "code"),
                getString(payload, "transaction_content")
        );

        GiaoDich giaoDich = giaoDichRepository
                .findFirstByHoaDon_MaHoaDonAndProviderAndTrangThaiIgnoreCaseOrderByNgayTaoDesc(
                        hoaDon.getMaHoaDon(),
                        "SEPAY",
                        "PENDING"
                )
                .orElseGet(() -> GiaoDich.builder()
                        .maGiaoDich(generateMaGiaoDich())
                        .hoaDon(hoaDon)
                        .nguoiDung(hoaDon.getNguoiDung())
                        .phuongThucThanhToan(phuongThuc)
                        .provider("SEPAY")
                        .providerTxnRef(hoaDon.getNoiDungChuyenKhoan())
                        .ngayTao(timestamp)
                        .build());

        giaoDich.setHoaDon(hoaDon);
        giaoDich.setNguoiDung(hoaDon.getNguoiDung());
        giaoDich.setPhuongThucThanhToan(phuongThuc);
        giaoDich.setSoTien(transferAmount);
        giaoDich.setTrangThai(status);
        giaoDich.setProvider("SEPAY");
        giaoDich.setProviderTxnRef(hoaDon.getNoiDungChuyenKhoan());
        giaoDich.setProviderTransactionNo(transactionNo);
        giaoDich.setProviderTransactionStatus(status);
        giaoDich.setBankCode(getString(payload, "gateway"));
        giaoDich.setBankAccount(firstNotBlank(
                getString(payload, "accountNumber"),
                getString(payload, "account_number")
        ));
        giaoDich.setPayDate(firstNotBlank(
                getString(payload, "transactionDate"),
                getString(payload, "transaction_date")
        ));
        giaoDich.setOrderInfo(content);
        giaoDich.setRawData(toJson(payload));
        giaoDich.setNoiDung(message);

        giaoDichRepository.save(giaoDich);
    }
}
