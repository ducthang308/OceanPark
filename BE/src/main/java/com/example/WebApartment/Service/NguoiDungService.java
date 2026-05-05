package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.NguoiDungDTO;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Models.VaiTro;
import com.example.WebApartment.Repository.NguoiDungRepository;
import com.example.WebApartment.Repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class NguoiDungService {

    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ROLE_ADMIN = "1";
    private static final String ROLE_NGUOI_THUE = "2";
    private static final String ROLE_NGUOI_CHO_THUE = "3";

    public List<NguoiDungDTO> getAll() {
        return nguoiDungRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public NguoiDungDTO getById(String maNguoiDung) {
        NguoiDung entity = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + maNguoiDung));

        return toDto(entity);
    }

    // API REGISTER: chỉ cho người thuê hoặc người cho thuê
    public NguoiDungDTO register(NguoiDungDTO dto) {
        validateRegister(dto);

        VaiTro vaiTro = vaiTroRepository.findById(dto.getMaVaiTro())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò với id: " + dto.getMaVaiTro()));

        NguoiDung entity = buildNguoiDungFromDto(dto, vaiTro);
        entity.setMaNguoiDung(generateMaNguoiDung());
        entity.setTrangThai(true);
        entity.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));

        return toDto(nguoiDungRepository.save(entity));
    }

    // CRUD CREATE: dùng cho admin tạo tài khoản, có thể tạo role 1/2/3
    public NguoiDungDTO create(NguoiDungDTO dto) {
        validateCreate(dto);

        VaiTro vaiTro = vaiTroRepository.findById(dto.getMaVaiTro())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò với id: " + dto.getMaVaiTro()));

        NguoiDung entity = buildNguoiDungFromDto(dto, vaiTro);

        if (entity.getMaNguoiDung() == null || entity.getMaNguoiDung().isBlank()) {
            entity.setMaNguoiDung(generateMaNguoiDung());
        }

        if (entity.getTrangThai() == null) {
            entity.setTrangThai(true);
        }

        entity.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));

        return toDto(nguoiDungRepository.save(entity));
    }

    public NguoiDungDTO update(String maNguoiDung, NguoiDungDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu cập nhật không hợp lệ");
        }

        NguoiDung existing = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (dto.getMaVaiTro() != null && !dto.getMaVaiTro().isBlank()) {
            if (!isValidRole(dto.getMaVaiTro())) {
                throw new RuntimeException("Vai trò không hợp lệ");
            }

            VaiTro vaiTro = vaiTroRepository.findById(dto.getMaVaiTro())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));
            existing.setVaiTro(vaiTro);
        }

        if (dto.getEmail() != null && !dto.getEmail().equals(existing.getEmail())) {
            if (nguoiDungRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Email đã tồn tại");
            }
            existing.setEmail(dto.getEmail());
        }

        if (dto.getSoDienThoai() != null && !dto.getSoDienThoai().equals(existing.getSoDienThoai())) {
            if (nguoiDungRepository.existsBySoDienThoai(dto.getSoDienThoai())) {
                throw new RuntimeException("Số điện thoại đã tồn tại");
            }
            existing.setSoDienThoai(dto.getSoDienThoai());
        }

        if (dto.getHoVaTen() != null) existing.setHoVaTen(dto.getHoVaTen());
        if (dto.getDiaChi() != null) existing.setDiaChi(dto.getDiaChi());
        if (dto.getTrangThai() != null) existing.setTrangThai(dto.getTrangThai());

        if (dto.getMatKhau() != null && !dto.getMatKhau().isBlank()) {
            existing.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));
        }

        if (dto.getFacebookAccount() != null) existing.setFacebookAccount(dto.getFacebookAccount());
        if (dto.getGoogleAccount() != null) existing.setGoogleAccount(dto.getGoogleAccount());
        if (dto.getAnhDaiDien() != null) existing.setAnhDaiDien(dto.getAnhDaiDien());

        return toDto(nguoiDungRepository.save(existing));
    }

    public void delete(String maNguoiDung) {
        NguoiDung existing = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        nguoiDungRepository.delete(existing);
    }

    public NguoiDung findBySoDienThoai(String soDienThoai) {
        return nguoiDungRepository.findBySoDienThoai(soDienThoai);
    }

    private void validateRegister(NguoiDungDTO dto) {
        validateCommonRequired(dto);

        if (dto.getMaVaiTro() == null || dto.getMaVaiTro().isBlank()) {
            throw new RuntimeException("Vui lòng chọn vai trò");
        }

        if (ROLE_ADMIN.equals(dto.getMaVaiTro())) {
            throw new RuntimeException("Không được đăng ký tài khoản ADMIN");
        }

        if (!ROLE_NGUOI_THUE.equals(dto.getMaVaiTro())
                && !ROLE_NGUOI_CHO_THUE.equals(dto.getMaVaiTro())) {
            throw new RuntimeException("Vai trò đăng ký không hợp lệ");
        }

        validateDuplicate(dto);
    }

    private void validateCreate(NguoiDungDTO dto) {
        validateCommonRequired(dto);

        if (dto.getMaVaiTro() == null || dto.getMaVaiTro().isBlank()) {
            throw new RuntimeException("Vai trò không được để trống");
        }

        if (!isValidRole(dto.getMaVaiTro())) {
            throw new RuntimeException("Vai trò không hợp lệ");
        }

        validateDuplicate(dto);
    }

    private void validateCommonRequired(NguoiDungDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu người dùng không hợp lệ");
        }

        if (dto.getHoVaTen() == null || dto.getHoVaTen().isBlank()) {
            throw new RuntimeException("Họ tên không được để trống");
        }

        if (dto.getSoDienThoai() == null || dto.getSoDienThoai().isBlank()) {
            throw new RuntimeException("Số điện thoại không được để trống");
        }

        if (dto.getMatKhau() == null || dto.getMatKhau().isBlank()) {
            throw new RuntimeException("Mật khẩu không được để trống");
        }
    }

    private void validateDuplicate(NguoiDungDTO dto) {
        if (nguoiDungRepository.existsBySoDienThoai(dto.getSoDienThoai())) {
            throw new RuntimeException("Số điện thoại đã tồn tại");
        }

        if (dto.getEmail() != null
                && !dto.getEmail().isBlank()
                && nguoiDungRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
    }

    private boolean isValidRole(String maVaiTro) {
        return ROLE_ADMIN.equals(maVaiTro)
                || ROLE_NGUOI_THUE.equals(maVaiTro)
                || ROLE_NGUOI_CHO_THUE.equals(maVaiTro);
    }

    private NguoiDung buildNguoiDungFromDto(NguoiDungDTO dto, VaiTro vaiTro) {
        return NguoiDung.builder()
                .maNguoiDung(dto.getMaNguoiDung())
                .vaiTro(vaiTro)
                .hoVaTen(dto.getHoVaTen())
                .email(dto.getEmail())
                .diaChi(dto.getDiaChi())
                .soDienThoai(dto.getSoDienThoai())
                .trangThai(dto.getTrangThai())
                .matKhau(dto.getMatKhau())
                .facebookAccount(dto.getFacebookAccount())
                .googleAccount(dto.getGoogleAccount())
                .anhDaiDien(dto.getAnhDaiDien())
                .build();
    }

    private NguoiDungDTO toDto(NguoiDung entity) {
        if (entity == null) return null;

        return NguoiDungDTO.builder()
                .maNguoiDung(entity.getMaNguoiDung())
                .maVaiTro(entity.getVaiTro() != null ? entity.getVaiTro().getMaVaiTro() : null)
                .hoVaTen(entity.getHoVaTen())
                .email(entity.getEmail())
                .diaChi(entity.getDiaChi())
                .soDienThoai(entity.getSoDienThoai())
                .trangThai(entity.getTrangThai())
                .matKhau(null)
                .facebookAccount(entity.getFacebookAccount())
                .googleAccount(entity.getGoogleAccount())
                .anhDaiDien(entity.getAnhDaiDien())
                .build();
    }

    private String generateMaNguoiDung() {
        List<String> list = nguoiDungRepository.findTopMaNguoiDung(PageRequest.of(0, 1));

        if (list.isEmpty()) {
            return "ND1";
        }

        String lastId = list.get(0); // VD: ND15

        int number = Integer.parseInt(lastId.replace("ND", ""));
        return "ND" + (number + 1);
    }
}