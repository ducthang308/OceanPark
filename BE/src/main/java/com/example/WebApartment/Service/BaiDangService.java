package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.DanhMuc;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.DanhMucRepository;
import com.example.WebApartment.Repository.GoiDangBaiRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangService {

    private final BaiDangRepository repo;
    private final NguoiDungRepository nguoiDungRepo;
    private final DanhMucRepository danhMucRepo;
    private final GoiDangBaiRepository goiDangBaiRepo;

    private static final String ROLE_NGUOI_CHO_THUE = "3";
    private static final String GOI_ACTIVE = "ACTIVE";
    private static final String POST_PENDING = "PENDING";
    private static final String POST_APPROVED = "APPROVED";
    private static final String POST_REJECTED = "REJECTED";

    public List<BaiDangDTO> getAll() {
        return repo.findByTrangThai("ACTIVE")
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public BaiDangDTO getById(String id) {
        BaiDang entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        return toDto(entity);
    }

    public BaiDangDTO increaseView(String id) {
        BaiDang entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        Long current = entity.getLuotXem() == null ? 0L : entity.getLuotXem();
        entity.setLuotXem(current + 1);

        return toDto(repo.save(entity));
    }

    public BaiDangDTO create(BaiDangDTO dto) {
        validateCreate(dto);

        NguoiDung nguoiDung = nguoiDungRepo.findById(dto.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (nguoiDung.getVaiTro() == null
                || !ROLE_NGUOI_CHO_THUE.equals(nguoiDung.getVaiTro().getMaVaiTro())) {
            throw new RuntimeException("Chỉ người cho thuê mới được đăng bài");
        }

        boolean hasActivePackage = goiDangBaiRepo
                .findFirstByNguoiDung_MaNguoiDungAndTrangThaiAndNgayKetThucAfter(
                        nguoiDung.getMaNguoiDung(),
                        GOI_ACTIVE,
                        LocalDateTime.now()
                )
                .isPresent();

        if (!hasActivePackage) {
            throw new RuntimeException("Bạn cần thanh toán gói đăng bài 50.000đ/tháng trước khi đăng bài");
        }

        DanhMuc danhMuc = danhMucRepo.findById(dto.getMaDanhMuc())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        BaiDang entity = BaiDang.builder()
                .maBaiDang(generateMaBaiDang())
                .nguoiDung(nguoiDung)
                .danhMuc(danhMuc)
                .tieuDe(dto.getTieuDe())
                .noiDung(dto.getNoiDung())
                .ngayDang(LocalDateTime.now())
                .trangThai(POST_PENDING)
                .lienHe(dto.getLienHe())
                .hinhThucThanhToan(dto.getHinhThucThanhToan())
                .build();

        return toDto(repo.save(entity));
    }

    public BaiDangDTO update(String id, BaiDangDTO dto) {
        BaiDang existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        if (dto.getTieuDe() != null) existing.setTieuDe(dto.getTieuDe());
        if (dto.getNoiDung() != null) existing.setNoiDung(dto.getNoiDung());
        if (dto.getTrangThai() != null) existing.setTrangThai(dto.getTrangThai());
        if (dto.getLienHe() != null) existing.setLienHe(dto.getLienHe());
        if (dto.getHinhThucThanhToan() != null) existing.setHinhThucThanhToan(dto.getHinhThucThanhToan());

        return toDto(repo.save(existing));
    }

    public void delete(String id) {
        BaiDang existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        repo.delete(existing);
    }

    public BaiDangDTO approve(String id) {
        BaiDang existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        existing.setTrangThai(POST_APPROVED);
        return toDto(repo.save(existing));
    }

    public BaiDangDTO reject(String id) {
        BaiDang existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        existing.setTrangThai(POST_REJECTED);
        return toDto(repo.save(existing));
    }

    private void validateCreate(BaiDangDTO dto) {
        if (dto == null) throw new RuntimeException("Dữ liệu bài đăng không hợp lệ");
        if (dto.getMaNguoiDung() == null || dto.getMaNguoiDung().isBlank()) {
            throw new RuntimeException("Mã người dùng không được để trống");
        }
        if (dto.getMaDanhMuc() == null || dto.getMaDanhMuc().isBlank()) {
            throw new RuntimeException("Mã danh mục không được để trống");
        }
        if (dto.getTieuDe() == null || dto.getTieuDe().isBlank()) {
            throw new RuntimeException("Tiêu đề không được để trống");
        }
        if (dto.getNoiDung() == null || dto.getNoiDung().isBlank()) {
            throw new RuntimeException("Nội dung không được để trống");
        }
    }

    private BaiDangDTO toDto(BaiDang e) {
        if (e == null) return null;

        return BaiDangDTO.builder()
                .maBaiDang(e.getMaBaiDang())
                .maNguoiDung(e.getNguoiDung() != null ? e.getNguoiDung().getMaNguoiDung() : null)
                .maDanhMuc(e.getDanhMuc() != null ? e.getDanhMuc().getMaDanhMuc() : null)
                .tieuDe(e.getTieuDe())
                .noiDung(e.getNoiDung())
                .ngayDang(e.getNgayDang())
                .trangThai(e.getTrangThai())
                .lienHe(e.getLienHe())
                .hinhThucThanhToan(e.getHinhThucThanhToan())
                .luotXem(e.getLuotXem())
                .build();
    }

    private String generateMaBaiDang() {
        List<BaiDang> all = repo.findAll();

        int maxNumber = all.stream()
                .map(BaiDang::getMaBaiDang)
                .filter(id -> id != null && id.startsWith("BD"))
                .map(id -> id.replace("BD", ""))
                .filter(number -> number.matches("\\d+"))
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0);

        return "BD" + (maxNumber + 1);
    }
}
