package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.LichSuTimKiemDTO;
import com.example.WebApartment.Service.LichSuTimKiemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lichsutimkiem")
@RequiredArgsConstructor
public class LichSuTimKiemController {

    private final LichSuTimKiemService service;

    @GetMapping
    public ResponseEntity<List<LichSuTimKiemDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{ma}")
    public ResponseEntity<LichSuTimKiemDTO> getById(@PathVariable String ma) {
        return ResponseEntity.ok(service.getById(ma));
    }

    @PostMapping
    public ResponseEntity<LichSuTimKiemDTO> create(@RequestBody LichSuTimKiemDTO dto) {
        return ResponseEntity.status(201).body(service.create(dto));
    }

    @PutMapping("/{ma}")
    public ResponseEntity<LichSuTimKiemDTO> update(@PathVariable String ma,
                                                   @RequestBody LichSuTimKiemDTO dto) {
        return ResponseEntity.ok(service.update(ma, dto));
    }

    @DeleteMapping("/{ma}")
    public ResponseEntity<Void> delete(@PathVariable String ma) {
        service.delete(ma);
        return ResponseEntity.noContent().build();
    }
}
