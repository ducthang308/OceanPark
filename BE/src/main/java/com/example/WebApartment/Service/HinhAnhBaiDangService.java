package com.example.WebApartment.Service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.WebApartment.DTO.HinhAnhBaiDangDTO;
import com.example.WebApartment.Models.BaiDang;
import com.example.WebApartment.Models.HinhAnhBaiDang;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.HinhAnhBaiDangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HinhAnhBaiDangService {

    private final HinhAnhBaiDangRepository hinhAnhRepo;
    private final BaiDangRepository baiDangRepo;
    private final Cloudinary cloudinary;

    public List<HinhAnhBaiDangDTO> getAll() {
        return hinhAnhRepo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public HinhAnhBaiDangDTO getById(String maHinhAnhBaiDang) {
        HinhAnhBaiDang entity = hinhAnhRepo.findById(maHinhAnhBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh bài đăng"));

        return toDto(entity);
    }

    public List<HinhAnhBaiDangDTO> getByMaBaiDang(String maBaiDang) {
        return hinhAnhRepo.findByBaiDang_MaBaiDangOrderByThuTuAsc(maBaiDang)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<HinhAnhBaiDangDTO> uploadMultipleImages(String maBaiDang,
                                                        MultipartFile[] files,
                                                        String loai) {
        if (files == null || files.length == 0) {
            throw new RuntimeException("Danh sách ảnh không được để trống");
        }

        BaiDang baiDang = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        HinhAnhBaiDang lastImage =
                hinhAnhRepo.findTopByBaiDang_MaBaiDangOrderByThuTuDesc(maBaiDang);

        int currentIndex = lastImage != null && lastImage.getThuTu() != null
                ? lastImage.getThuTu()
                : 0;

        List<HinhAnhBaiDangDTO> result = new java.util.ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            currentIndex++;

            try {
                Map uploadResult = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "web-apartment/bai-dang",
                                "resource_type", "image"
                        )
                );

                String imageUrl = uploadResult.get("secure_url").toString();

                HinhAnhBaiDang entity = HinhAnhBaiDang.builder()
                        .maHinhAnhBaiDang(UUID.randomUUID().toString())
                        .baiDang(baiDang)
                        .loai(loai != null && !loai.isBlank() ? loai : "IMAGE")
                        .duongDan(imageUrl)
                        .thumbnailUrl(imageUrl)
                        .thuTu(currentIndex)
                        .build();

                result.add(toDto(hinhAnhRepo.save(entity)));

            } catch (Exception e) {
                throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage());
            }
        }

        return result;
    }

    public HinhAnhBaiDangDTO uploadImage(String maBaiDang,
                                         MultipartFile file,
                                         String loai,
                                         Integer thuTu) {
        if (maBaiDang == null || maBaiDang.isBlank()) {
            throw new RuntimeException("Mã bài đăng không được để trống");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File ảnh không được để trống");
        }

        BaiDang baiDang = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "web-apartment/bai-dang",
                            "resource_type", "image"
                    )
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            HinhAnhBaiDang entity = HinhAnhBaiDang.builder()
                    .maHinhAnhBaiDang(UUID.randomUUID().toString())
                    .baiDang(baiDang)
                    .loai(loai != null && !loai.isBlank() ? loai : "IMAGE")
                    .duongDan(imageUrl)
                    .thumbnailUrl(imageUrl)
                    .thuTu(thuTu != null ? thuTu : 1)
                    .build();

            return toDto(hinhAnhRepo.save(entity));

        } catch (Exception e) {
            throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage());
        }
    }

    public HinhAnhBaiDangDTO updateInfo(String maHinhAnhBaiDang, HinhAnhBaiDangDTO dto) {
        HinhAnhBaiDang existing = hinhAnhRepo.findById(maHinhAnhBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh bài đăng"));

        if (dto.getLoai() != null) existing.setLoai(dto.getLoai());
        if (dto.getThumbnailUrl() != null) existing.setThumbnailUrl(dto.getThumbnailUrl());
        if (dto.getThuTu() != null) existing.setThuTu(dto.getThuTu());

        return toDto(hinhAnhRepo.save(existing));
    }

    public void delete(String maHinhAnhBaiDang) {
        HinhAnhBaiDang existing = hinhAnhRepo.findById(maHinhAnhBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh bài đăng"));

        hinhAnhRepo.delete(existing);
    }

    private HinhAnhBaiDangDTO toDto(HinhAnhBaiDang entity) {
        if (entity == null) return null;

        return HinhAnhBaiDangDTO.builder()
                .maHinhAnhBaiDang(entity.getMaHinhAnhBaiDang())
                .maBaiDang(entity.getBaiDang() != null ? entity.getBaiDang().getMaBaiDang() : null)
                .loai(entity.getLoai())
                .duongDan(entity.getDuongDan())
                .thumbnailUrl(entity.getThumbnailUrl())
                .thuTu(entity.getThuTu())
                .build();
    }
}