package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.HoaDonDTO;
import com.example.WebApartment.Service.HoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/hoa-don")
@RequiredArgsConstructor
public class HoaDonController {

    private final HoaDonService hoaDonService;

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping
    public ResponseEntity<List<HoaDonDTO>> getAll() {
        return ResponseEntity.ok(hoaDonService.getAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping("/{maHoaDon}")
    public ResponseEntity<HoaDonDTO> getById(@PathVariable String maHoaDon) {
        return ResponseEntity.ok(hoaDonService.getById(maHoaDon));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping("/nguoi-dung/{maNguoiDung}")
    public ResponseEntity<List<HoaDonDTO>> getByNguoiDung(@PathVariable String maNguoiDung) {
        return ResponseEntity.ok(hoaDonService.getByNguoiDung(maNguoiDung));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping("/bai-dang/{maBaiDang}")
    public ResponseEntity<List<HoaDonDTO>> getByBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(hoaDonService.getByBaiDang(maBaiDang));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @PostMapping
    public ResponseEntity<HoaDonDTO> create(@RequestBody HoaDonDTO dto) {
        return ResponseEntity.status(201).body(hoaDonService.create(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @PutMapping("/{maHoaDon}")
    public ResponseEntity<HoaDonDTO> update(
            @PathVariable String maHoaDon,
            @RequestBody HoaDonDTO dto
    ) {
        return ResponseEntity.ok(hoaDonService.update(maHoaDon, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{maHoaDon}")
    public ResponseEntity<Void> delete(@PathVariable String maHoaDon) {
        hoaDonService.delete(maHoaDon);
        return ResponseEntity.noContent().build();
    }
}