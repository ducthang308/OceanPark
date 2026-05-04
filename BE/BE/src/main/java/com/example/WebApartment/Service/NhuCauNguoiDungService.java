package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.NhuCauNguoiDungDTO;
import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Models.NhuCauNguoiDung;
import com.example.WebApartment.Repository.NguoiDungRepository;
import com.example.WebApartment.Repository.NhuCauNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NhuCauNguoiDungService {

    private final NhuCauNguoiDungRepository nhuCauNguoiDungRepository;
    private final NguoiDungRepository nguoiDungRepository;

    // ========================= CRUD =========================

    public List<NhuCauNguoiDungDTO> getAll() {
        return nhuCauNguoiDungRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public NhuCauNguoiDungDTO getById(String maNhuCauNguoiDung) {
        NhuCauNguoiDung entity = nhuCauNguoiDungRepository.findById(maNhuCauNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhu cầu với id: " + maNhuCauNguoiDung));

        return toDto(entity);
    }

    public NhuCauNguoiDungDTO create(NhuCauNguoiDungDTO dto) {

        NguoiDung nguoiDung = getNguoiDung(dto.getMaNguoiDung());

        NhuCauNguoiDung entity = toEntity(dto, nguoiDung);

        // auto ID
        if (entity.getMaNhuCauNguoiDung() == null) {
            entity.setMaNhuCauNguoiDung(UUID.randomUUID().toString());
        }

        if (entity.getNgayTao() == null) {
            entity.setNgayTao(LocalDateTime.now());
        }

        return toDto(nhuCauNguoiDungRepository.save(entity));
    }

    public NhuCauNguoiDungDTO update(String maNhuCauNguoiDung, NhuCauNguoiDungDTO dto) {

        NhuCauNguoiDung existing = nhuCauNguoiDungRepository.findById(maNhuCauNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhu cầu"));

        if (dto.getMaNguoiDung() != null) {
            NguoiDung nguoiDung = getNguoiDung(dto.getMaNguoiDung());
            existing.setNguoiDung(nguoiDung);
        }

        if (dto.getMinPrice() != null) existing.setMinPrice(dto.getMinPrice());
        if (dto.getMaxPrice() != null) existing.setMaxPrice(dto.getMaxPrice());
        if (dto.getPhuong() != null) existing.setPhuong(dto.getPhuong());
        if (dto.getLoaiCanHo() != null) existing.setLoaiCanHo(dto.getLoaiCanHo());
        if (dto.getCoBanCong() != null) existing.setCoBanCong(dto.getCoBanCong());
        if (dto.getDayDuNoiThat() != null) existing.setDayDuNoiThat(dto.getDayDuNoiThat());
        if (dto.getGanTrungTam() != null) existing.setGanTrungTam(dto.getGanTrungTam());
        if (dto.getGanBien() != null) existing.setGanBien(dto.getGanBien());

        return toDto(nhuCauNguoiDungRepository.save(existing));
    }

    public void delete(String maNhuCauNguoiDung) {
        NhuCauNguoiDung existing = nhuCauNguoiDungRepository.findById(maNhuCauNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhu cầu"));

        nhuCauNguoiDungRepository.delete(existing);
    }

    // ========================= HELPER =========================

    private NguoiDung getNguoiDung(String maNguoiDung) {
        if (maNguoiDung == null) {
            throw new RuntimeException("maNguoiDung không được để trống");
        }

        return nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + maNguoiDung));
    }

    // ========================= MAPPER =========================

    private NhuCauNguoiDungDTO toDto(NhuCauNguoiDung entity) {
        if (entity == null) return null;

        return NhuCauNguoiDungDTO.builder()
                .maNhuCauNguoiDung(entity.getMaNhuCauNguoiDung())
                .maNguoiDung(entity.getNguoiDung() != null ? entity.getNguoiDung().getMaNguoiDung() : null)
                .minPrice(entity.getMinPrice())
                .maxPrice(entity.getMaxPrice())
                .phuong(entity.getPhuong())
                .loaiCanHo(entity.getLoaiCanHo())
                .coBanCong(entity.getCoBanCong())
                .dayDuNoiThat(entity.getDayDuNoiThat())
                .ganTrungTam(entity.getGanTrungTam())
                .ganBien(entity.getGanBien())
                .ngayTao(entity.getNgayTao())
                .build();
    }

    private NhuCauNguoiDung toEntity(NhuCauNguoiDungDTO dto, NguoiDung nguoiDung) {
        if (dto == null) return null;

        return NhuCauNguoiDung.builder()
                .maNhuCauNguoiDung(dto.getMaNhuCauNguoiDung())
                .nguoiDung(nguoiDung)
                .minPrice(dto.getMinPrice())
                .maxPrice(dto.getMaxPrice())
                .phuong(dto.getPhuong())
                .loaiCanHo(dto.getLoaiCanHo())
                .coBanCong(dto.getCoBanCong())
                .dayDuNoiThat(dto.getDayDuNoiThat())
                .ganTrungTam(dto.getGanTrungTam())
                .ganBien(dto.getGanBien())
                .ngayTao(dto.getNgayTao())
                .build();
    }
}