package com.example.WebApartment.Service;

import com.example.WebApartment.DTO.DashboardStatsDTO;
import com.example.WebApartment.Models.HoaDon;
import com.example.WebApartment.Repository.BaiDangRepository;
import com.example.WebApartment.Repository.HoaDonRepository;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final HoaDonRepository hoaDonRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;

    public DashboardStatsDTO getStats() {

        Double totalRevenue = hoaDonRepository
                .findByLoaiHoaDonAndTrangThaiThanhToan("DANG_BAI", "SUCCESS")
                .stream()
                .map(HoaDon::getSoTien)
                .filter(Objects::nonNull)
                .reduce(0D, Double::sum);

        Long totalUsers = nguoiDungRepository.count();

        Long totalPosts = baiDangRepository.count();

        Long activePosts = baiDangRepository
                .countByTrangThaiIgnoreCase("ACTIVE");

        Long rentedPosts = baiDangRepository
                .countByTrangThaiIgnoreCase("DA_THUE");

        return DashboardStatsDTO.builder()
                .totalRevenue(totalRevenue)
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .activePosts(activePosts)
                .rentedPosts(rentedPosts)
                .build();
    }
}