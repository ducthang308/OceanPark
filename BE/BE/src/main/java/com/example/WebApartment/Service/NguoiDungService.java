package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.NguoiDungDTO;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Models.VaiTro;
import com.example.WebApartment.Repository.NguoiDungRepository;
import com.example.WebApartment.Repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NguoiDungService {

    private final NguoiDungRepository nguoiDungRepository;
    private final VaiTroRepository vaiTroRepository;

    // ========================= CRUD =========================

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

    public NguoiDungDTO create(NguoiDungDTO dto) {

        VaiTro vaiTro = null;

        if (dto.getMaVaiTro() != null) {
            vaiTro = vaiTroRepository.findById(dto.getMaVaiTro())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò với id: " + dto.getMaVaiTro()));
        }

        NguoiDung entity = toEntity(dto, vaiTro);

        // auto tạo id nếu chưa có
        if (entity.getMaNguoiDung() == null) {
            entity.setMaNguoiDung(UUID.randomUUID().toString());
        }

        return toDto(nguoiDungRepository.save(entity));
    }

    public NguoiDungDTO update(String maNguoiDung, NguoiDungDTO dto) {

        NguoiDung existing = nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (dto.getMaVaiTro() != null) {
            VaiTro vaiTro = vaiTroRepository.findById(dto.getMaVaiTro())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));
            existing.setVaiTro(vaiTro);
        }

        if (dto.getHoVaTen() != null) existing.setHoVaTen(dto.getHoVaTen());
        if (dto.getEmail() != null) existing.setEmail(dto.getEmail());
        if (dto.getDiaChi() != null) existing.setDiaChi(dto.getDiaChi());
        if (dto.getSoDienThoai() != null) existing.setSoDienThoai(dto.getSoDienThoai());
        if (dto.getTrangThai() != null) existing.setTrangThai(dto.getTrangThai());
        if (dto.getMatKhau() != null) existing.setMatKhau(dto.getMatKhau());
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

    // ========================= MAPPER =========================

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
                .matKhau(entity.getMatKhau())
                .facebookAccount(entity.getFacebookAccount())
                .googleAccount(entity.getGoogleAccount())
                .anhDaiDien(entity.getAnhDaiDien())
                .build();
    }

    private NguoiDung toEntity(NguoiDungDTO dto, VaiTro vaiTro) {
        if (dto == null) return null;

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
}