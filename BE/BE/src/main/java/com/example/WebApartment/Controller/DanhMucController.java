package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.DanhMucDTO;
import com.example.WebApartment.Service.DanhMucService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/danhmuc")
@RequiredArgsConstructor
public class DanhMucController {

    private final DanhMucService service;

    @GetMapping
    public ResponseEntity<List<DanhMucDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ma}")
    public ResponseEntity<DanhMucDTO> getById(@PathVariable String ma) {
        return ResponseEntity.ok(service.getById(ma));
    }

    @PostMapping
    public ResponseEntity<DanhMucDTO> create(@RequestBody DanhMucDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{ma}")
    public ResponseEntity<DanhMucDTO> update(@PathVariable String ma,
                                             @RequestBody DanhMucDTO dto) {
        return ResponseEntity.ok(service.update(ma, dto));
    }

    @DeleteMapping("/{ma}")
    public ResponseEntity<Void> delete(@PathVariable String ma) {
        service.delete(ma);
        return ResponseEntity.noContent().build();
    }
}