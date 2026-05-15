package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.LichSuTimKiemDTO;
import com.example.WebApartment.Service.LichSuTimKiemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/lich-su-tim-kiem")
@RequiredArgsConstructor
public class LichSuTimKiemController {

    private final LichSuTimKiemService lichSuTimKiemService;

    @GetMapping
    public ResponseEntity<List<LichSuTimKiemDTO>> getAll() {
        return ResponseEntity.ok(lichSuTimKiemService.getAll());
    }

    @GetMapping("/{maLichSuTimKiem}")
    public ResponseEntity<LichSuTimKiemDTO> getById(
            @PathVariable String maLichSuTimKiem
    ) {
        return ResponseEntity.ok(lichSuTimKiemService.getById(maLichSuTimKiem));
    }

    @GetMapping("/nguoi-dung/{maNguoiDung}")
    public ResponseEntity<List<LichSuTimKiemDTO>> getByNguoiDung(
            @PathVariable String maNguoiDung
    ) {
        return ResponseEntity.ok(lichSuTimKiemService.getByNguoiDung(maNguoiDung));
    }

    @PostMapping
    public ResponseEntity<LichSuTimKiemDTO> create(
            @RequestBody LichSuTimKiemDTO dto
    ) {
        return ResponseEntity.status(201).body(lichSuTimKiemService.create(dto));
    }

    @DeleteMapping("/{maLichSuTimKiem}")
    public ResponseEntity<Void> delete(
            @PathVariable String maLichSuTimKiem
    ) {
        lichSuTimKiemService.delete(maLichSuTimKiem);
        return ResponseEntity.noContent().build();
    }
}