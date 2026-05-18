package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.BaiDangYeuThichDTO;
import com.example.WebApartment.Service.BaiDangYeuThichService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/bai-dang-yeu-thich")
@RequiredArgsConstructor
public class BaiDangYeuThichController {

    private final BaiDangYeuThichService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE','NGUOI_THUE')")
    public ResponseEntity<List<BaiDangYeuThichDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/nguoi-dung/{maNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE','NGUOI_THUE')")
    public ResponseEntity<List<BaiDangYeuThichDTO>> getByMaNguoiDung(@PathVariable String maNguoiDung) {
        return ResponseEntity.ok(service.getByMaNguoiDung(maNguoiDung));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE','NGUOI_THUE')")
    @GetMapping("/bai-dang/{maBaiDang}")
    public ResponseEntity<List<BaiDangYeuThichDTO>> getByMaBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(service.getByMaBaiDang(maBaiDang));
    }

    @GetMapping("/bai-dang/{maBaiDang}/count")
    public ResponseEntity<Long> countByMaBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(service.countByMaBaiDang(maBaiDang));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE','NGUOI_THUE')")
    @PostMapping
    public ResponseEntity<BaiDangYeuThichDTO> addFavorite(@RequestBody BaiDangYeuThichDTO dto) {
        return ResponseEntity.status(201).body(service.addFavorite(dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE','NGUOI_THUE')")
    @DeleteMapping("/nguoi-dung/{maNguoiDung}/bai-dang/{maBaiDang}")
    public ResponseEntity<Void> removeFavorite(@PathVariable String maNguoiDung,
                                               @PathVariable String maBaiDang) {
        service.removeFavorite(maNguoiDung, maBaiDang);
        return ResponseEntity.noContent().build();
    }
}
