package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.ChiTietHoaDonDTO;
import com.example.WebApartment.Service.ChiTietHoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/chi-tiet-hoa-don")
@RequiredArgsConstructor
public class ChiTietHoaDonController {

    private final ChiTietHoaDonService service;

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping
    public ResponseEntity<List<ChiTietHoaDonDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping("/{maChiTietHoaDon}")
    public ResponseEntity<ChiTietHoaDonDTO> getById(@PathVariable String maChiTietHoaDon) {
        return ResponseEntity.ok(service.getById(maChiTietHoaDon));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping("/hoa-don/{maHoaDon}")
    public ResponseEntity<List<ChiTietHoaDonDTO>> getByHoaDon(@PathVariable String maHoaDon) {
        return ResponseEntity.ok(service.getByHoaDon(maHoaDon));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    @GetMapping("/bai-dang/{maBaiDang}")
    public ResponseEntity<List<ChiTietHoaDonDTO>> getByBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(service.getByBaiDang(maBaiDang));
    }
}
