package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.DanhMuc;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.DanhMucRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangService {

    private final BaiDangRepository repo;
    private final NguoiDungRepository nguoiDungRepo;
    private final DanhMucRepository danhMucRepo;

    // ===== GET ALL =====
    public List<BaiDangDTO> getAll() {
        return repo.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    // ===== GET BY ID =====
    public BaiDangDTO getById(String id) {
        BaiDang entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        return toDto(entity);
    }

    // ===== CREATE =====
    public BaiDangDTO create(BaiDangDTO dto) {

        NguoiDung nguoiDung = nguoiDungRepo.findById(dto.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        DanhMuc danhMuc = danhMucRepo.findById(dto.getMaDanhMuc())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        BaiDang entity = BaiDang.builder()
                .maBaiDang(UUID.randomUUID().toString())
                .nguoiDung(nguoiDung)
                .danhMuc(danhMuc)
                .tieuDe(dto.getTieuDe())
                .noiDung(dto.getNoiDung())
                .ngayDang(LocalDateTime.now())
                .trangThai("ACTIVE")
                .lienHe(dto.getLienHe())
                .phuongThucThanhToan(dto.getPhuongThucThanhToan())
                .build();

        return toDto(repo.save(entity));
    }

    // ===== UPDATE =====
    public BaiDangDTO update(String id, BaiDangDTO dto) {

        BaiDang existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        if (dto.getTieuDe() != null) existing.setTieuDe(dto.getTieuDe());
        if (dto.getNoiDung() != null) existing.setNoiDung(dto.getNoiDung());
        if (dto.getTrangThai() != null) existing.setTrangThai(dto.getTrangThai());
        if (dto.getLienHe() != null) existing.setLienHe(dto.getLienHe());
        if (dto.getPhuongThucThanhToan() != null)
            existing.setPhuongThucThanhToan(dto.getPhuongThucThanhToan());

        return toDto(repo.save(existing));
    }

    // ===== DELETE =====
    public void delete(String id) {
        repo.deleteById(id);
    }

    // ===== MAPPER =====
    private BaiDangDTO toDto(BaiDang e) {
        return BaiDangDTO.builder()
                .maBaiDang(e.getMaBaiDang())
                .maNguoiDung(e.getNguoiDung() != null ? e.getNguoiDung().getMaNguoiDung() : null)
                .maDanhMuc(e.getDanhMuc() != null ? e.getDanhMuc().getMaDanhMuc() : null)
                .tieuDe(e.getTieuDe())
                .noiDung(e.getNoiDung())
                .ngayDang(e.getNgayDang())
                .trangThai(e.getTrangThai())
                .lienHe(e.getLienHe())
                .phuongThucThanhToan(e.getPhuongThucThanhToan())
                .build();
    }
}
