package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.BaiDangYeuThichDTO;
import com.example.WebApartment.Models.*;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.BaiDangYeuThichRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangYeuThichService {

    private final BaiDangYeuThichRepository yeuThichRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;

    public List<BaiDangYeuThichDTO> getAll() {
        return yeuThichRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BaiDangYeuThichDTO> getByMaNguoiDung(String maNguoiDung) {
        return yeuThichRepository.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BaiDangYeuThichDTO> getByMaBaiDang(String maBaiDang) {
        return yeuThichRepository.findByBaiDang_MaBaiDang(maBaiDang)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public BaiDangYeuThichDTO addFavorite(BaiDangYeuThichDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu yêu thích không hợp lệ");
        }

        if (dto.getMaNguoiDung() == null || dto.getMaNguoiDung().isBlank()) {
            throw new RuntimeException("Mã người dùng không được để trống");
        }

        if (dto.getMaBaiDang() == null || dto.getMaBaiDang().isBlank()) {
            throw new RuntimeException("Mã bài đăng không được để trống");
        }

        if (yeuThichRepository.existsByNguoiDung_MaNguoiDungAndBaiDang_MaBaiDang(
                dto.getMaNguoiDung(),
                dto.getMaBaiDang()
        )) {
            throw new RuntimeException("Bài đăng đã được yêu thích");
        }

        NguoiDung nguoiDung = nguoiDungRepository.findById(dto.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        BaiDang baiDang = baiDangRepository.findById(dto.getMaBaiDang())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        BaiDangYeuThichId id = BaiDangYeuThichId.builder()
                .maNguoiDung(dto.getMaNguoiDung())
                .maBaiDang(dto.getMaBaiDang())
                .build();

        BaiDangYeuThich entity = BaiDangYeuThich.builder()
                .id(id)
                .nguoiDung(nguoiDung)
                .baiDang(baiDang)
                .ngayTao(LocalDateTime.now())
                .build();

        return toDto(yeuThichRepository.save(entity));
    }

    @Transactional
    public void removeFavorite(String maNguoiDung, String maBaiDang) {
        if (!yeuThichRepository.existsByNguoiDung_MaNguoiDungAndBaiDang_MaBaiDang(maNguoiDung, maBaiDang)) {
            throw new RuntimeException("Bài đăng chưa được yêu thích");
        }

        yeuThichRepository.deleteByNguoiDung_MaNguoiDungAndBaiDang_MaBaiDang(maNguoiDung, maBaiDang);
    }

    public long countByMaBaiDang(String maBaiDang) {
        return yeuThichRepository.findByBaiDang_MaBaiDang(maBaiDang).size();
    }

    private BaiDangYeuThichDTO toDto(BaiDangYeuThich entity) {
        if (entity == null) return null;

        return BaiDangYeuThichDTO.builder()
                .maNguoiDung(entity.getNguoiDung() != null ? entity.getNguoiDung().getMaNguoiDung() : null)
                .maBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getMaBaiDang() : null)
                .tieuDeBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getTieuDe() : null)
                .ngayTao(entity.getNgayTao())
                .build();
    }
}