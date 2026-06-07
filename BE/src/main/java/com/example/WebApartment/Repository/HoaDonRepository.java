package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.HoaDon;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, String> {

    List<HoaDon> findByNguoiDung_MaNguoiDung(String maNguoiDung);

    List<HoaDon> findByBaiDang_MaBaiDang(String maBaiDang);

    List<HoaDon> findByLoaiHoaDon(String loaiHoaDon);

    List<HoaDon> findByTrangThaiThanhToan(String trangThaiThanhToan);

    Optional<HoaDon> findByNoiDungChuyenKhoan(String noiDungChuyenKhoan);

    List<HoaDon> findByLoaiHoaDonAndTrangThaiThanhToan(
            String loaiHoaDon,
            String trangThaiThanhToan
    );

    List<HoaDon> findByBaiDang_NguoiDung_MaNguoiDungAndLoaiHoaDonAndTrangThaiThanhToan(
            String maNguoiDung,
            String loaiHoaDon,
            String trangThaiThanhToan
    );

    List<HoaDon> findByBaiDang_MaBaiDangAndLoaiHoaDonAndTrangThaiThanhToan(
            String maBaiDang,
            String loaiHoaDon,
            String trangThaiThanhToan
    );

    long countByTrangThaiThanhToanIgnoreCase(String trangThaiThanhToan);

    @Query("""
            select distinct h.ngayKetThuc
            from HoaDon h
            left join h.baiDang bd
            left join h.chiTietHoaDon cthd
            left join cthd.baiDang ctb
            where h.ngayKetThuc is not null
              and upper(h.trangThaiHieuLuc) = 'DANG_HIEU_LUC'
              and upper(h.trangThaiThanhToan) = 'SUCCESS'
              and upper(h.loaiHoaDon) = 'THUE_CAN_HO'
              and (
                    bd.maBaiDang = :maBaiDang
                    or ctb.maBaiDang = :maBaiDang
              )
            order by h.ngayKetThuc asc
            """)
    List<LocalDateTime> findActiveRentEndDatesByBaiDang(
            @Param("maBaiDang") String maBaiDang,
            Pageable pageable
    );
}
