package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.ChiTietCanHo;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChiTietCanHoRepository extends JpaRepository<ChiTietCanHo, String> {

    Optional<ChiTietCanHo> findByBaiDang_MaBaiDang(String maBaiDang);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ChiTietCanHo c where c.baiDang.maBaiDang = :maBaiDang")
    Optional<ChiTietCanHo> findForUpdateByBaiDangMaBaiDang(@Param("maBaiDang") String maBaiDang);

    boolean existsByBaiDang_MaBaiDang(String maBaiDang);

    List<ChiTietCanHo> findByGiaLessThanEqual(Double gia);

    List<ChiTietCanHo> findByPhuongContainingIgnoreCase(String phuong);

    List<ChiTietCanHo> findByGiaLessThanEqualAndPhuongContainingIgnoreCase(
            Double gia,
            String phuong
    );

    @Query("""
            select c from ChiTietCanHo c
            join c.baiDang b
            left join b.danhMuc dm
            where upper(b.trangThai) in ('ACTIVE', 'APPROVED')
              and (c.soLuongTrong is null or c.soLuongTrong > 0)
              and (:category is null
                    or lower(dm.tenDanhMuc) like lower(concat('%', :category, '%'))
                    or lower(dm.maDanhMuc) like lower(concat('%', :category, '%')))
              and (:minPrice is null or (c.gia is not null and c.gia >= :minPrice))
              and (:maxPrice is null or (c.gia is not null and c.gia <= :maxPrice))
              and (:minArea is null or (c.dienTich is not null and c.dienTich >= :minArea))
              and (:maxArea is null or (c.dienTich is not null and c.dienTich <= :maxArea))
              and (:bedrooms is null or c.phongNgu = :bedrooms)
              and (:phuong is null or lower(c.phuong) like lower(concat('%', :phuong, '%'))
                    or lower(c.diaChiCuThe) like lower(concat('%', :phuong, '%')))
              and (:huong is null or lower(c.huongCanHo) like lower(concat('%', :huong, '%')))
              and (:keyword is null
                    or lower(b.tieuDe) like lower(concat('%', :keyword, '%'))
                    or lower(b.noiDung) like lower(concat('%', :keyword, '%'))
                    or lower(c.phuong) like lower(concat('%', :keyword, '%'))
                    or lower(c.diaChiCuThe) like lower(concat('%', :keyword, '%'))
                    or lower(c.huongCanHo) like lower(concat('%', :keyword, '%')))
            order by c.ngayTao desc
            """)
    List<ChiTietCanHo> searchActiveForChatbot(
            @Param("category") String category,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("minArea") Float minArea,
            @Param("maxArea") Float maxArea,
            @Param("bedrooms") Integer bedrooms,
            @Param("phuong") String phuong,
            @Param("huong") String huong,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
            select c from ChiTietCanHo c
            join c.baiDang b
            where upper(b.trangThai) in ('ACTIVE', 'APPROVED')
              and (c.soLuongTrong is null or c.soLuongTrong > 0)
              and b.maBaiDang in :maBaiDangIds
            """)
    List<ChiTietCanHo> findActiveByBaiDangIds(
            @Param("maBaiDangIds") List<String> maBaiDangIds
    );
}
