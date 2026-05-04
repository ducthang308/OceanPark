package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.NguoiDungDTO;
import com.example.WebApartment.Service.NguoiDungService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nguoidung")
@RequiredArgsConstructor
public class NguoiDungController {

    private final NguoiDungService nguoiDungService;

    // ================= GET ALL =================
    @GetMapping
    public ResponseEntity<List<NguoiDungDTO>> getAll() {
        return ResponseEntity.ok(nguoiDungService.getAll());
    }

    // ================= GET BY ID =================
    @GetMapping("/{maNguoiDung}")
    public ResponseEntity<NguoiDungDTO> getById(@PathVariable String maNguoiDung) {
        return ResponseEntity.ok(nguoiDungService.getById(maNguoiDung));
    }

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<NguoiDungDTO> create(@RequestBody NguoiDungDTO dto) {
        return ResponseEntity.status(201).body(nguoiDungService.create(dto));
    }

    // ================= UPDATE =================
    @PutMapping("/{maNguoiDung}")
    public ResponseEntity<NguoiDungDTO> update(@PathVariable String maNguoiDung,
                                               @RequestBody NguoiDungDTO dto) {
        return ResponseEntity.ok(nguoiDungService.update(maNguoiDung, dto));
    }

    // ================= DELETE =================
    @DeleteMapping("/{maNguoiDung}")
    public ResponseEntity<Void> delete(@PathVariable String maNguoiDung) {
        nguoiDungService.delete(maNguoiDung);
        return ResponseEntity.noContent().build();
    }
}