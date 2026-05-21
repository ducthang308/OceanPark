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

    private static final String MEDIA_FOLDER = "web-apartment/bai-dang";
    private static final String IMAGE_TYPE = "IMAGE";
    private static final String VIDEO_TYPE = "VIDEO";

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

        int currentIndex = getLastThuTu(maBaiDang);

        List<HinhAnhBaiDangDTO> result = new java.util.ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            currentIndex++;
            result.add(uploadMedia(baiDang, file, normalizeLoai(loai, IMAGE_TYPE), "image", currentIndex, "ảnh"));
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

        return uploadMedia(
                baiDang,
                file,
                normalizeLoai(loai, IMAGE_TYPE),
                "image",
                thuTu != null ? thuTu : 1,
                "ảnh"
        );
    }

    public HinhAnhBaiDangDTO uploadVideo(String maBaiDang,
                                         MultipartFile file,
                                         Integer thuTu) {
        if (maBaiDang == null || maBaiDang.isBlank()) {
            throw new RuntimeException("Mã bài đăng không được để trống");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File video không được để trống");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("video/")) {
            throw new RuntimeException("Vui lòng chọn đúng định dạng video");
        }

        BaiDang baiDang = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        return uploadMedia(
                baiDang,
                file,
                VIDEO_TYPE,
                "video",
                thuTu != null ? thuTu : getLastThuTu(maBaiDang) + 1,
                "video"
        );
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

    private HinhAnhBaiDangDTO uploadMedia(BaiDang baiDang,
                                          MultipartFile file,
                                          String loai,
                                          String resourceType,
                                          Integer thuTu,
                                          String errorLabel) {
        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", MEDIA_FOLDER,
                            "resource_type", resourceType
                    )
            );

            Object secureUrlValue = uploadResult.get("secure_url");
            if (secureUrlValue == null) {
                throw new RuntimeException("Cloudinary không trả về URL");
            }

            String mediaUrl = secureUrlValue.toString();
            String thumbnailUrl = VIDEO_TYPE.equalsIgnoreCase(loai)
                    ? buildVideoThumbnailUrl(mediaUrl)
                    : mediaUrl;

            HinhAnhBaiDang entity = HinhAnhBaiDang.builder()
                    .maHinhAnhBaiDang(UUID.randomUUID().toString())
                    .baiDang(baiDang)
                    .loai(loai)
                    .duongDan(mediaUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .thuTu(thuTu)
                    .build();

            return toDto(hinhAnhRepo.save(entity));
        } catch (Exception e) {
            throw new RuntimeException("Upload " + errorLabel + " thất bại: " + e.getMessage());
        }
    }

    private int getLastThuTu(String maBaiDang) {
        HinhAnhBaiDang lastMedia =
                hinhAnhRepo.findTopByBaiDang_MaBaiDangOrderByThuTuDesc(maBaiDang);

        return lastMedia != null && lastMedia.getThuTu() != null
                ? lastMedia.getThuTu()
                : 0;
    }

    private String normalizeLoai(String loai, String defaultLoai) {
        return loai != null && !loai.isBlank() ? loai : defaultLoai;
    }

    private String buildVideoThumbnailUrl(String videoUrl) {
        if (videoUrl == null || videoUrl.isBlank()) {
            return null;
        }

        int extensionIndex = videoUrl.lastIndexOf('.');
        int lastSlashIndex = videoUrl.lastIndexOf('/');
        String baseUrl = extensionIndex > lastSlashIndex
                ? videoUrl.substring(0, extensionIndex)
                : videoUrl;

        return baseUrl.replace("/video/upload/", "/video/upload/so_0/") + ".jpg";
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
