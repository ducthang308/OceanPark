package com.example.WebApartment.Controller;

import com.example.WebApartment.DTO.HinhAnhBaiDangDTO;
import com.example.WebApartment.Service.HinhAnhBaiDangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/hinh-anh-bai-dang")
@RequiredArgsConstructor
public class HinhAnhBaiDangController {

    private final HinhAnhBaiDangService service;

    @GetMapping
    public ResponseEntity<List<HinhAnhBaiDangDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{maHinhAnhBaiDang}")
    public ResponseEntity<HinhAnhBaiDangDTO> getById(@PathVariable String maHinhAnhBaiDang) {
        return ResponseEntity.ok(service.getById(maHinhAnhBaiDang));
    }

    @GetMapping("/bai-dang/{maBaiDang}")
    public ResponseEntity<List<HinhAnhBaiDangDTO>> getByMaBaiDang(@PathVariable String maBaiDang) {
        return ResponseEntity.ok(service.getByMaBaiDang(maBaiDang));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<HinhAnhBaiDangDTO>> uploadMultipleImages(
            @RequestParam("maBaiDang") String maBaiDang,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "loai", required = false) String loai
    ) {
        return ResponseEntity.status(201).body(
                service.uploadMultipleImages(maBaiDang, files, loai)
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HinhAnhBaiDangDTO> uploadImage(
            @RequestParam("maBaiDang") String maBaiDang,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "loai", required = false) String loai,
            @RequestParam(value = "thuTu", required = false) Integer thuTu
    ) {
        return ResponseEntity.status(201).body(
                service.uploadImage(maBaiDang, file, loai, thuTu)
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    @PutMapping("/{maHinhAnhBaiDang}")
    public ResponseEntity<HinhAnhBaiDangDTO> updateInfo(
            @PathVariable String maHinhAnhBaiDang,
            @RequestBody HinhAnhBaiDangDTO dto
    ) {
        return ResponseEntity.ok(service.updateInfo(maHinhAnhBaiDang, dto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','NGUOI_CHO_THUE')")
    @DeleteMapping("/{maHinhAnhBaiDang}")
    public ResponseEntity<Void> delete(@PathVariable String maHinhAnhBaiDang) {
        service.delete(maHinhAnhBaiDang);
        return ResponseEntity.noContent().build();
    }
}