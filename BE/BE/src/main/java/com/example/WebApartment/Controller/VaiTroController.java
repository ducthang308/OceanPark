package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.VaiTroDTO;
import com.example.WebApartment.Service.VaiTroService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/vaitro")
@RequiredArgsConstructor
public class VaiTroController {

    private final VaiTroService vaiTroService;

    // ================= GET ALL =================
    @GetMapping
    public List<VaiTroDTO> getAll() {
        return vaiTroService.getAll();
    }

    // ================= GET BY ID =================
    @GetMapping("/{maVaiTro}")
    public ResponseEntity<VaiTroDTO> getById(@PathVariable String maVaiTro) {
        return ResponseEntity.ok(vaiTroService.getById(maVaiTro));
    }

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<VaiTroDTO> create(@RequestBody VaiTroDTO dto) {
        return ResponseEntity.status(201).body(vaiTroService.create(dto));
    }

    // ================= UPDATE =================
    @PutMapping("/{maVaiTro}")
    public VaiTroDTO update(@PathVariable String maVaiTro,
                            @RequestBody VaiTroDTO dto) {
        return vaiTroService.update(maVaiTro, dto);
    }

    // ================= DELETE =================
    @DeleteMapping("/{maVaiTro}")
    public ResponseEntity<Void> delete(@PathVariable String maVaiTro) {
        vaiTroService.delete(maVaiTro);
        return ResponseEntity.noContent().build();
    }
}