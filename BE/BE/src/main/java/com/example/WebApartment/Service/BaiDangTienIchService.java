package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.BaiDangTienIchDTO;
import com.example.WebApartment.Models.*;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.BaiDangTienIchRepository;
import com.example.WebApartment.Repository.TienIchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangTienIchService {

    private final BaiDangTienIchRepository baiDangTienIchRepository;
    private final BaiDangRepository baiDangRepository;
    private final TienIchRepository tienIchRepository;

    public List<BaiDangTienIchDTO> getAll() {
        return baiDangTienIchRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BaiDangTienIchDTO> getByMaBaiDang(String maBaiDang) {
        return baiDangTienIchRepository.findByBaiDang_MaBaiDang(maBaiDang)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public BaiDangTienIchDTO addTienIchToBaiDang(BaiDangTienIchDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Dữ liệu không hợp lệ");
        }

        if (dto.getMaBaiDang() == null || dto.getMaBaiDang().isBlank()) {
            throw new RuntimeException("Mã bài đăng không được để trống");
        }

        if (dto.getMaTienIch() == null || dto.getMaTienIch().isBlank()) {
            throw new RuntimeException("Mã tiện ích không được để trống");
        }

        if (baiDangTienIchRepository.existsByBaiDang_MaBaiDangAndTienIch_MaTienIch(
                dto.getMaBaiDang(),
                dto.getMaTienIch()
        )) {
            throw new RuntimeException("Bài đăng đã có tiện ích này");
        }

        BaiDang baiDang = baiDangRepository.findById(dto.getMaBaiDang())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        TienIch tienIch = tienIchRepository.findById(dto.getMaTienIch())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tiện ích"));

        BaiDangTienIchId id = BaiDangTienIchId.builder()
                .maBaiDang(dto.getMaBaiDang())
                .maTienIch(dto.getMaTienIch())
                .build();

        BaiDangTienIch entity = BaiDangTienIch.builder()
                .id(id)
                .baiDang(baiDang)
                .tienIch(tienIch)
                .build();

        return toDto(baiDangTienIchRepository.save(entity));
    }

    @Transactional
    public void removeTienIchFromBaiDang(String maBaiDang, String maTienIch) {
        if (!baiDangTienIchRepository.existsByBaiDang_MaBaiDangAndTienIch_MaTienIch(maBaiDang, maTienIch)) {
            throw new RuntimeException("Bài đăng chưa có tiện ích này");
        }

        baiDangTienIchRepository.deleteByBaiDang_MaBaiDangAndTienIch_MaTienIch(maBaiDang, maTienIch);
    }

    private BaiDangTienIchDTO toDto(BaiDangTienIch entity) {
        if (entity == null) return null;

        return BaiDangTienIchDTO.builder()
                .maBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getMaBaiDang() : null)
                .maTienIch(entity.getTienIch() != null ? entity.getTienIch().getMaTienIch() : null)
                .tenTienIch(entity.getTienIch() != null ? entity.getTienIch().getTenTienIch() : null)
                .build();
    }
}