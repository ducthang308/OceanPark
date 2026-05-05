package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.MucDichThanhToanDTO;
import com.example.WebApartment.Service.MucDichThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/mucdich-thanhtoan")
@RequiredArgsConstructor
public class MucDichThanhToanController {

    private final MucDichThanhToanService service;

    @GetMapping
    public ResponseEntity<List<MucDichThanhToanDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ma}")
    public ResponseEntity<MucDichThanhToanDTO> getById(@PathVariable String ma) {
        return ResponseEntity.ok(service.getById(ma));
    }

    @PostMapping
    public ResponseEntity<MucDichThanhToanDTO> create(@RequestBody MucDichThanhToanDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{ma}")
    public ResponseEntity<MucDichThanhToanDTO> update(@PathVariable String ma,
                                                      @RequestBody MucDichThanhToanDTO dto) {
        return ResponseEntity.ok(service.update(ma, dto));
    }

    @DeleteMapping("/{ma}")
    public ResponseEntity<Void> delete(@PathVariable String ma) {
        service.delete(ma);
        return ResponseEntity.noContent().build();
    }
}