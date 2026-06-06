package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.ChiTietHoaDonDTO;
import com.example.WebApartment.Models.ChiTietCanHo;
import com.example.WebApartment.Models.ChiTietHoaDon;
import com.example.WebApartment.Repository.ChiTietCanHoRepository;
import com.example.WebApartment.Repository.ChiTietHoaDonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChiTietHoaDonService {

    private final ChiTietHoaDonRepository repository;
    private final ChiTietCanHoRepository chiTietCanHoRepository;

    public List<ChiTietHoaDonDTO> getAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public ChiTietHoaDonDTO getById(String maChiTietHoaDon) {
        ChiTietHoaDon entity = repository.findById(maChiTietHoaDon)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));
        return toDto(entity);
    }

    public List<ChiTietHoaDonDTO> getByHoaDon(String maHoaDon) {
        return repository.findByHoaDon_MaHoaDon(maHoaDon).stream().map(this::toDto).toList();
    }

    public List<ChiTietHoaDonDTO> getByBaiDang(String maBaiDang) {
        return repository.findByBaiDang_MaBaiDang(maBaiDang).stream().map(this::toDto).toList();
    }

    public ChiTietHoaDonDTO toDto(ChiTietHoaDon entity) {
        if (entity == null) return null;

        String maBaiDang = entity.getBaiDang() != null ? entity.getBaiDang().getMaBaiDang() : null;
        ChiTietCanHo canHo = maBaiDang == null
                ? null
                : chiTietCanHoRepository.findByBaiDang_MaBaiDang(maBaiDang).orElse(null);

        return ChiTietHoaDonDTO.builder()
                .maChiTietHoaDon(entity.getMaChiTietHoaDon())
                .maHoaDon(entity.getHoaDon() != null ? entity.getHoaDon().getMaHoaDon() : null)
                .maBaiDang(maBaiDang)
                .soLuong(entity.getSoLuong())
                .donGia(entity.getDonGia())
                .thanhTien(entity.getThanhTien())
                .ghiChu(entity.getGhiChu())
                .tieuDeBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getTieuDe() : null)
                .diaChiCanHo(canHo != null ? canHo.getDiaChiCuThe() : null)
                .phuong(canHo != null ? canHo.getPhuong() : null)
                .build();
    }
}
