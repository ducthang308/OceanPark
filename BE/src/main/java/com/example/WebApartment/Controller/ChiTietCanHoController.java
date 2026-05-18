package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.ChiTietCanHoDTO;
import com.example.WebApartment.Service.ChiTietCanHoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/chi-tiet-can-ho")
@RequiredArgsConstructor
public class ChiTietCanHoController {

    private final ChiTietCanHoService service;

    // ===== GET ALL =====
    @GetMapping
    public ResponseEntity<List<ChiTietCanHoDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ===== GET BY ID =====
    @GetMapping("/{maChiTietCanHo}")
    public ResponseEntity<ChiTietCanHoDTO> getById(@PathVariable String maChiTietCanHo) {
        return ResponseEntity.ok(service.getById(maChiTietCanHo));
    }

    // ===== GET BY BAI DANG =====
    @GetMapping("/bai-dang/{maBaiDang}")
    public ResponseEntity<ChiTietCanHoDTO> getByMaBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(service.getByMaBaiDang(maBaiDang));
    }

    // ===== CREATE =====
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    @PostMapping
    public ResponseEntity<ChiTietCanHoDTO> create(@RequestBody ChiTietCanHoDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    // ===== UPDATE =====
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    @PutMapping("/{maChiTietCanHo}")
    public ResponseEntity<ChiTietCanHoDTO> update(@PathVariable String maChiTietCanHo,
                                                  @RequestBody ChiTietCanHoDTO dto) {
        return ResponseEntity.ok(service.update(maChiTietCanHo, dto));
    }

    // ===== DELETE =====
    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{maChiTietCanHo}")
    public ResponseEntity<Void> delete(@PathVariable String maChiTietCanHo) {
        service.delete(maChiTietCanHo);
        return ResponseEntity.noContent().build();
    }
}
