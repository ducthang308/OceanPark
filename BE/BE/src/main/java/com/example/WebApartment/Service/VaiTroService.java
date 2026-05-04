package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.VaiTroDTO;
import com.example.WebApartment.Models.VaiTro;
import com.example.WebApartment.Repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VaiTroService {

    private final VaiTroRepository vaiTroRepository;

    // ========================= CRUD =========================

    public List<VaiTroDTO> getAll() {
        return vaiTroRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public VaiTroDTO getById(String maVaiTro) {
        VaiTro entity = vaiTroRepository.findById(maVaiTro)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò với id: " + maVaiTro));

        return toDto(entity);
    }

    public VaiTroDTO create(VaiTroDTO dto) {

        // check trùng PK
        if (vaiTroRepository.existsById(dto.getMaVaiTro())) {
            throw new RuntimeException("Mã vai trò đã tồn tại");
        }

        VaiTro entity = VaiTro.builder()
                .maVaiTro(dto.getMaVaiTro())
                .tenVaiTro(dto.getTenVaiTro())
                .build();

        return toDto(vaiTroRepository.save(entity));
    }

    public VaiTroDTO update(String maVaiTro, VaiTroDTO dto) {

        VaiTro existing = vaiTroRepository.findById(maVaiTro)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));

        if (dto.getTenVaiTro() != null) {
            existing.setTenVaiTro(dto.getTenVaiTro());
        }

        return toDto(vaiTroRepository.save(existing));
    }

    public void delete(String maVaiTro) {

        VaiTro existing = vaiTroRepository.findById(maVaiTro)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò"));

        // nếu m có mapping OneToMany thì giữ, không thì bỏ
        if (existing.getNguoiDungs() != null && !existing.getNguoiDungs().isEmpty()) {
            throw new RuntimeException("Không thể xóa vai trò đang được sử dụng");
        }

        vaiTroRepository.delete(existing);
    }

    // ========================= MAPPER =========================

    private VaiTroDTO toDto(VaiTro entity) {
        return VaiTroDTO.builder()
                .maVaiTro(entity.getMaVaiTro())
                .tenVaiTro(entity.getTenVaiTro())
                .build();
    }
}