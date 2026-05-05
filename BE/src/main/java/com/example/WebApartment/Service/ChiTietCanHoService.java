package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.ChiTietCanHoDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChiTietCanHoService {

    private final ChiTietCanHoRepository repo;
    private final BaiDangRepository baiDangRepo;

    public List<ChiTietCanHoDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ChiTietCanHoDTO getById(String maChiTietCanHo) {
        ChiTietCanHo entity = repo.findById(maChiTietCanHo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết căn hộ"));

        return toDto(entity);
    }

    public ChiTietCanHoDTO getByMaBaiDang(String maBaiDang) {
        ChiTietCanHo entity = repo.findByBaiDang_MaBaiDang(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết căn hộ của bài đăng"));

        return toDto(entity);
    }

    public ChiTietCanHoDTO create(ChiTietCanHoDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu chi tiết căn hộ không hợp lệ");
        }

        if (dto.getMaBaiDang() == null || dto.getMaBaiDang().isBlank()) {
            throw new RuntimeException("Mã bài đăng không được để trống");
        }

        if (repo.existsByBaiDang_MaBaiDang(dto.getMaBaiDang())) {
            throw new RuntimeException("Bài đăng này đã có chi tiết căn hộ");
        }

        BaiDang baiDang = baiDangRepo.findById(dto.getMaBaiDang())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        ChiTietCanHo entity = ChiTietCanHo.builder()
                .maChiTietCanHo(UUID.randomUUID().toString())
                .baiDang(baiDang)
                .gia(dto.getGia())
                .dienTich(dto.getDienTich())
                .phongNgu(dto.getPhongNgu())
                .diaChiCuThe(dto.getDiaChiCuThe())
                .huongCanHo(dto.getHuongCanHo())
                .phuong(dto.getPhuong())
                .lat(dto.getLat())
                .lng(dto.getLng())
                .ngayTao(LocalDateTime.now())
                .build();

        return toDto(repo.save(entity));
    }

    public ChiTietCanHoDTO update(String maChiTietCanHo, ChiTietCanHoDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu cập nhật không hợp lệ");
        }

        ChiTietCanHo existing = repo.findById(maChiTietCanHo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết căn hộ"));

        if (dto.getGia() != null) existing.setGia(dto.getGia());
        if (dto.getDienTich() != null) existing.setDienTich(dto.getDienTich());
        if (dto.getPhongNgu() != null) existing.setPhongNgu(dto.getPhongNgu());
        if (dto.getDiaChiCuThe() != null) existing.setDiaChiCuThe(dto.getDiaChiCuThe());
        if (dto.getHuongCanHo() != null) existing.setHuongCanHo(dto.getHuongCanHo());
        if (dto.getPhuong() != null) existing.setPhuong(dto.getPhuong());
        if (dto.getLat() != null) existing.setLat(dto.getLat());
        if (dto.getLng() != null) existing.setLng(dto.getLng());

        return toDto(repo.save(existing));
    }

    public void delete(String maChiTietCanHo) {
        ChiTietCanHo existing = repo.findById(maChiTietCanHo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết căn hộ"));

        repo.delete(existing);
    }

    private ChiTietCanHoDTO toDto(ChiTietCanHo entity) {
        if (entity == null) return null;

        return ChiTietCanHoDTO.builder()
                .maChiTietCanHo(entity.getMaChiTietCanHo())
                .maBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getMaBaiDang() : null)
                .gia(entity.getGia())
                .dienTich(entity.getDienTich())
                .phongNgu(entity.getPhongNgu())
                .diaChiCuThe(entity.getDiaChiCuThe())
                .huongCanHo(entity.getHuongCanHo())
                .phuong(entity.getPhuong())
                .lat(entity.getLat())
                .lng(entity.getLng())
                .ngayTao(entity.getNgayTao())
                .build();
    }
}