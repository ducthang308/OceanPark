package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.BaiDangDTO;
import com.example.WebApartment.Service.BaiDangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/bai-dang")
@RequiredArgsConstructor
public class BaiDangController {

    private final BaiDangService service;

    @GetMapping
    public ResponseEntity<List<BaiDangDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaiDangDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<BaiDangDTO> create(@RequestBody BaiDangDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<BaiDangDTO> update(@PathVariable String id,
                                             @RequestBody BaiDangDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}