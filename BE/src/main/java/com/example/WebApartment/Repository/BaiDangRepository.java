package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.BaiDang;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BaiDangRepository extends JpaRepository<BaiDang, String> {
    boolean existsByDanhMuc_MaDanhMuc(String maDanhMuc);
    Optional<BaiDang> findTopByOrderByMaBaiDangDesc();
    long countByTrangThaiIgnoreCase(String trangThai);

    List<BaiDang> findByTrangThai(String trangThai);

    long countByNguoiDung_MaNguoiDung(String maNguoiDung);

    long countByNguoiDung_MaNguoiDungAndTrangThaiIgnoreCase(
            String maNguoiDung,
            String trangThai
    );

    List<BaiDang> findByNguoiDung_MaNguoiDung(String maNguoiDung);

    List<BaiDang> findByTrangThaiIgnoreCaseOrderByNgayDangDesc(String trangThai, Pageable pageable);

    @Query("""
            select b from BaiDang b
            where upper(b.trangThai) in ('ACTIVE', 'APPROVED', 'DA_THUE')
            order by
              case
                when upper(b.trangThai) = 'ACTIVE' then 0
                when upper(b.trangThai) = 'APPROVED' then 1
                when upper(b.trangThai) = 'DA_THUE' then 2
                else 3
              end,
              coalesce(b.luotXem, 0) desc,
              b.ngayDang desc
            """)
    List<BaiDang> findHomeVisiblePosts(Pageable pageable);
}
