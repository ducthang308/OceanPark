package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.PhuongThucThanhToanDTO;
import com.example.WebApartment.Service.PhuongThucThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/phuongthuc-thanhtoan")
@RequiredArgsConstructor
public class PhuongThucThanhToanController {

    private final PhuongThucThanhToanService service;

    @GetMapping
    public ResponseEntity<List<PhuongThucThanhToanDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ma}")
    public ResponseEntity<PhuongThucThanhToanDTO> getById(@PathVariable String ma) {
        return ResponseEntity.ok(service.getById(ma));
    }

    @PostMapping
    public ResponseEntity<PhuongThucThanhToanDTO> create(@RequestBody PhuongThucThanhToanDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{ma}")
    public ResponseEntity<PhuongThucThanhToanDTO> update(@PathVariable String ma,
                                                         @RequestBody PhuongThucThanhToanDTO dto) {
        return ResponseEntity.ok(service.update(ma, dto));
    }

    @DeleteMapping("/{ma}")
    public ResponseEntity<Void> delete(@PathVariable String ma) {
        service.delete(ma);
        return ResponseEntity.noContent().build();
    }
}