package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.TienIchDTO;
import com.example.WebApartment.Service.TienIchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/tien-ich")
@RequiredArgsConstructor
public class TienIchController {

    private final TienIchService service;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<TienIchDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{ma}")
    public ResponseEntity<TienIchDTO> getById(@PathVariable String ma) {
        return ResponseEntity.ok(service.getById(ma));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<TienIchDTO> create(@RequestBody TienIchDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{ma}")
    public ResponseEntity<TienIchDTO> update(@PathVariable String ma,
                                             @RequestBody TienIchDTO dto) {
        return ResponseEntity.ok(service.update(ma, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{ma}")
    public ResponseEntity<Void> delete(@PathVariable String ma) {
        service.delete(ma);
        return ResponseEntity.noContent().build();
    }
}