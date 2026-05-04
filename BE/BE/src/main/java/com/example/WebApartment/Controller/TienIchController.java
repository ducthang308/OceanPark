package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.TienIchDTO;
import com.example.WebApartment.Service.TienIchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tienich")
@RequiredArgsConstructor
public class TienIchController {

    private final TienIchService service;

    @GetMapping
    public ResponseEntity<List<TienIchDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ma}")
    public ResponseEntity<TienIchDTO> getById(@PathVariable String ma) {
        return ResponseEntity.ok(service.getById(ma));
    }

    @PostMapping
    public ResponseEntity<TienIchDTO> create(@RequestBody TienIchDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{ma}")
    public ResponseEntity<TienIchDTO> update(@PathVariable String ma,
                                             @RequestBody TienIchDTO dto) {
        return ResponseEntity.ok(service.update(ma, dto));
    }

    @DeleteMapping("/{ma}")
    public ResponseEntity<Void> delete(@PathVariable String ma) {
        service.delete(ma);
        return ResponseEntity.noContent().build();
    }
}