package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.*;
import com.example.WebApartment.Models.*;
import com.example.WebApartment.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ViNguoiChoThueService {

    private final ViNguoiChoThueRepository viRepo;
    private final GiaoDichViRepository giaoDichViRepo;
    private final YeuCauRutTienRepository yeuCauRutTienRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final HoaDonRepository hoaDonRepo;

    public ViNguoiChoThueDTO getByNguoiDung(String maNguoiDung) {
        ViNguoiChoThue vi = getOrCreateVi(maNguoiDung);
        return toViDto(vi);
    }

    public List<GiaoDichViDTO> getLichSuGiaoDich(String maNguoiDung) {
        ViNguoiChoThue vi = getOrCreateVi(maNguoiDung);

        return giaoDichViRepo.findByVi_MaViOrderByNgayTaoDesc(vi.getMaVi())
                .stream()
                .map(this::toGiaoDichDto)
                .toList();
    }

    public List<YeuCauRutTienDTO> getYeuCauRutTienByNguoiDung(String maNguoiDung) {
        ViNguoiChoThue vi = getOrCreateVi(maNguoiDung);

        return yeuCauRutTienRepo.findByVi_MaViOrderByNgayTaoDesc(vi.getMaVi())
                .stream()
                .map(this::toYeuCauDto)
                .toList();
    }

    public List<YeuCauRutTienDTO> getAllYeuCauRutTien() {
        return yeuCauRutTienRepo.findAllByOrderByNgayTaoDesc()
                .stream()
                .map(this::toYeuCauDto)
                .toList();
    }

    @Transactional
    public YeuCauRutTienDTO createWithdrawRequest(CreateWithdrawRequest request) {
        if (request == null || isBlank(request.getMaNguoiDung())) {
            throw new RuntimeException("Thông tin người dùng không hợp lệ");
        }

        if (isBlank(request.getBankCode())
                || isBlank(request.getBankAccount())
                || isBlank(request.getAccountName())) {
            throw new RuntimeException("Thông tin ngân hàng không được để trống");
        }

        if (request.getSoTien() == null || request.getSoTien() <= 0) {
            throw new RuntimeException("Số tiền rút không hợp lệ");
        }

        ViNguoiChoThue vi = getOrCreateVi(request.getMaNguoiDung());

        if (vi.getSoDuKhaDung() < request.getSoTien()) {
            throw new RuntimeException("Số dư khả dụng không đủ");
        }

        vi.setSoDuKhaDung(vi.getSoDuKhaDung() - request.getSoTien());
        vi.setSoDuChoRut(vi.getSoDuChoRut() + request.getSoTien());
        viRepo.save(vi);

        YeuCauRutTien yc = YeuCauRutTien.builder()
                .maYeuCauRutTien(generateId("YCRT"))
                .vi(vi)
                .bankCode(request.getBankCode())
                .bankAccount(request.getBankAccount())
                .accountName(request.getAccountName())
                .soTien(request.getSoTien())
                .trangThai("PENDING")
                .ngayTao(LocalDateTime.now())
                .build();

        GiaoDichVi gd = GiaoDichVi.builder()
                .maGiaoDichVi(generateId("GDV"))
                .vi(vi)
                .loaiGiaoDich("WITHDRAW_REQUEST")
                .soTien(-request.getSoTien())
                .noiDung("Tạo yêu cầu rút tiền")
                .ngayTao(LocalDateTime.now())
                .build();

        giaoDichViRepo.save(gd);

        return toYeuCauDto(yeuCauRutTienRepo.save(yc));
    }

    @Transactional
    public YeuCauRutTienDTO approveWithdraw(String maYeuCauRutTien) {
        YeuCauRutTien yc = yeuCauRutTienRepo.findById(maYeuCauRutTien)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu rút tiền"));

        if (!"PENDING".equalsIgnoreCase(yc.getTrangThai())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý");
        }

        ViNguoiChoThue vi = yc.getVi();

        vi.setSoDuChoRut(vi.getSoDuChoRut() - yc.getSoTien());
        viRepo.save(vi);

        yc.setTrangThai("SUCCESS");
        yc.setNgayXuLy(LocalDateTime.now());

        GiaoDichVi gd = GiaoDichVi.builder()
                .maGiaoDichVi(generateId("GDV"))
                .vi(vi)
                .loaiGiaoDich("WITHDRAW_SUCCESS")
                .soTien(0D)
                .noiDung("Admin xác nhận đã chuyển khoản rút tiền: " + yc.getSoTien())
                .ngayTao(LocalDateTime.now())
                .build();

        giaoDichViRepo.save(gd);

        return toYeuCauDto(yeuCauRutTienRepo.save(yc));
    }

    @Transactional
    public YeuCauRutTienDTO rejectWithdraw(String maYeuCauRutTien) {
        YeuCauRutTien yc = yeuCauRutTienRepo.findById(maYeuCauRutTien)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu rút tiền"));

        if (!"PENDING".equalsIgnoreCase(yc.getTrangThai())) {
            throw new RuntimeException("Yêu cầu này đã được xử lý");
        }

        ViNguoiChoThue vi = yc.getVi();

        vi.setSoDuChoRut(vi.getSoDuChoRut() - yc.getSoTien());
        vi.setSoDuKhaDung(vi.getSoDuKhaDung() + yc.getSoTien());
        viRepo.save(vi);

        yc.setTrangThai("REJECTED");
        yc.setNgayXuLy(LocalDateTime.now());

        GiaoDichVi gd = GiaoDichVi.builder()
                .maGiaoDichVi(generateId("GDV"))
                .vi(vi)
                .loaiGiaoDich("WITHDRAW_REJECTED")
                .soTien(yc.getSoTien())
                .noiDung("Admin từ chối rút tiền, hoàn lại số dư")
                .ngayTao(LocalDateTime.now())
                .build();

        giaoDichViRepo.save(gd);

        return toYeuCauDto(yeuCauRutTienRepo.save(yc));
    }

    @Transactional
    public void congDoanhThuChoNguoiChoThue(
            String maNguoiDung,
            String maHoaDon,
            Double soTien
    ) {
        if (soTien == null || soTien <= 0) return;

        ViNguoiChoThue vi = getOrCreateVi(maNguoiDung);

        HoaDon hoaDon = hoaDonRepo.findById(maHoaDon)
                .orElse(null);

        vi.setSoDuKhaDung(vi.getSoDuKhaDung() + soTien);
        vi.setTongDoanhThu(vi.getTongDoanhThu() + soTien);

        viRepo.save(vi);

        GiaoDichVi gd = GiaoDichVi.builder()
                .maGiaoDichVi(generateId("GDV"))
                .vi(vi)
                .hoaDon(hoaDon)
                .loaiGiaoDich("RENT_REVENUE")
                .soTien(soTien)
                .noiDung("Cộng doanh thu từ hóa đơn thuê căn hộ " + maHoaDon)
                .ngayTao(LocalDateTime.now())
                .build();

        giaoDichViRepo.save(gd);
    }

    private ViNguoiChoThue getOrCreateVi(String maNguoiDung) {
        return viRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .orElseGet(() -> {
                    NguoiDung nguoiDung = nguoiDungRepo.findById(maNguoiDung)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

                    ViNguoiChoThue vi = ViNguoiChoThue.builder()
                            .maVi(generateId("VI"))
                            .nguoiDung(nguoiDung)
                            .soDuKhaDung(0D)
                            .soDuChoRut(0D)
                            .tongDoanhThu(0D)
                            .ngayTao(LocalDateTime.now())
                            .build();

                    return viRepo.save(vi);
                });
    }

    private ViNguoiChoThueDTO toViDto(ViNguoiChoThue vi) {
        return ViNguoiChoThueDTO.builder()
                .maVi(vi.getMaVi())
                .maNguoiDung(vi.getNguoiDung().getMaNguoiDung())
                .tenNguoiDung(vi.getNguoiDung().getHoVaTen())
                .soDuKhaDung(vi.getSoDuKhaDung())
                .soDuChoRut(vi.getSoDuChoRut())
                .tongDoanhThu(vi.getTongDoanhThu())
                .build();
    }

    private GiaoDichViDTO toGiaoDichDto(GiaoDichVi gd) {
        return GiaoDichViDTO.builder()
                .maGiaoDichVi(gd.getMaGiaoDichVi())
                .maVi(gd.getVi().getMaVi())
                .maHoaDon(gd.getHoaDon() != null ? gd.getHoaDon().getMaHoaDon() : null)
                .loaiGiaoDich(gd.getLoaiGiaoDich())
                .soTien(gd.getSoTien())
                .noiDung(gd.getNoiDung())
                .ngayTao(gd.getNgayTao())
                .build();
    }

    private YeuCauRutTienDTO toYeuCauDto(YeuCauRutTien yc) {
        NguoiDung nguoiDung = yc.getVi() != null ? yc.getVi().getNguoiDung() : null;

        return YeuCauRutTienDTO.builder()
                .maYeuCauRutTien(yc.getMaYeuCauRutTien())
                .maVi(yc.getVi().getMaVi())
                .maNguoiDung(nguoiDung != null ? nguoiDung.getMaNguoiDung() : null)
                .tenNguoiDung(nguoiDung != null ? nguoiDung.getHoVaTen() : null)
                .emailNguoiDung(nguoiDung != null ? nguoiDung.getEmail() : null)
                .soDienThoaiNguoiDung(nguoiDung != null ? nguoiDung.getSoDienThoai() : null)
                .bankCode(yc.getBankCode())
                .bankAccount(yc.getBankAccount())
                .accountName(yc.getAccountName())
                .soTien(yc.getSoTien())
                .trangThai(yc.getTrangThai())
                .ngayTao(yc.getNgayTao())
                .ngayXuLy(yc.getNgayXuLy())
                .build();
    }

    private String generateId(String prefix) {
        return prefix + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
