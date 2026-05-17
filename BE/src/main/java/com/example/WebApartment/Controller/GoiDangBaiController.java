package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.GoiDangBaiDTO;
import com.example.WebApartment.Service.GoiDangBaiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/goi-dang-bai")
@RequiredArgsConstructor
public class GoiDangBaiController {

    private final GoiDangBaiService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<GoiDangBaiDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{maGoiDangBai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GoiDangBaiDTO> getById(@PathVariable String maGoiDangBai) {
        return ResponseEntity.ok(service.getById(maGoiDangBai));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GoiDangBaiDTO> create(@RequestBody GoiDangBaiDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{maGoiDangBai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GoiDangBaiDTO> update(
            @PathVariable String maGoiDangBai,
            @RequestBody GoiDangBaiDTO dto
    ) {
        return ResponseEntity.ok(service.update(maGoiDangBai, dto));
    }

    @DeleteMapping("/{maGoiDangBai}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String maGoiDangBai) {
        service.delete(maGoiDangBai);
        return ResponseEntity.noContent().build();
    }
}
