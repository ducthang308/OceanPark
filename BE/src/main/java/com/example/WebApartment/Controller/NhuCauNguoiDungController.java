package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.NhuCauNguoiDungDTO;
import com.example.WebApartment.Service.NhuCauNguoiDungService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/nhucaunguoidung")
@RequiredArgsConstructor
public class NhuCauNguoiDungController {

    private final NhuCauNguoiDungService nhuCauNguoiDungService;

    // ================= GET ALL =================
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<List<NhuCauNguoiDungDTO>> getAll() {
        return ResponseEntity.ok(nhuCauNguoiDungService.getAll());
    }

    // ================= GET BY ID =================
    @GetMapping("/{maNhuCauNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<NhuCauNguoiDungDTO> getById(
            @PathVariable String maNhuCauNguoiDung) {
        return ResponseEntity.ok(
                nhuCauNguoiDungService.getById(maNhuCauNguoiDung)
        );
    }

    @GetMapping("/nguoi-dung/{maNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<NhuCauNguoiDungDTO> getByNguoiDung(
            @PathVariable String maNguoiDung) {
        NhuCauNguoiDungDTO dto = nhuCauNguoiDungService.getByNguoiDung(maNguoiDung);

        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    // ================= CREATE =================
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<NhuCauNguoiDungDTO> create(
            @RequestBody NhuCauNguoiDungDTO dto) {
        return ResponseEntity.status(201)
                .body(nhuCauNguoiDungService.create(dto));
    }

    // ================= UPDATE =================
    @PutMapping("/{maNhuCauNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<NhuCauNguoiDungDTO> update(
            @PathVariable String maNhuCauNguoiDung,
            @RequestBody NhuCauNguoiDungDTO dto) {

        return ResponseEntity.ok(
                nhuCauNguoiDungService.update(maNhuCauNguoiDung, dto)
        );
    }

    // ================= DELETE =================
    @DeleteMapping("/{maNhuCauNguoiDung}")
    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_THUE','NGUOI_CHO_THUE')")
    public ResponseEntity<Void> delete(
            @PathVariable String maNhuCauNguoiDung) {

        nhuCauNguoiDungService.delete(maNhuCauNguoiDung);
        return ResponseEntity.noContent().build();
    }
}
