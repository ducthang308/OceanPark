package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.BaiDangTienIchDTO;
import com.example.WebApartment.Service.BaiDangTienIchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/bai-dang-tien-ich")
@RequiredArgsConstructor
public class BaiDangTienIchController {

    private final BaiDangTienIchService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<List<BaiDangTienIchDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/bai-dang/{maBaiDang}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<List<BaiDangTienIchDTO>> getByMaBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(service.getByMaBaiDang(maBaiDang));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<BaiDangTienIchDTO> addTienIchToBaiDang(@RequestBody BaiDangTienIchDTO dto) {
        return ResponseEntity.status(201).body(service.addTienIchToBaiDang(dto));
    }

    @DeleteMapping("/bai-dang/{maBaiDang}/tien-ich/{maTienIch}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<Void> removeTienIchFromBaiDang(@PathVariable String maBaiDang,
                                                         @PathVariable String maTienIch) {
        service.removeTienIchFromBaiDang(maBaiDang, maTienIch);
        return ResponseEntity.noContent().build();
    }
}