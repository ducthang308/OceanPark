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
            where upper(b.trangThai) = 'ACTIVE'
              and (:maxPrice is null or c.gia <= :maxPrice)
              and (:phuong is null or lower(c.phuong) like lower(concat('%', :phuong, '%')))
            order by c.ngayTao desc
            """)
    List<ChiTietCanHo> searchActiveForChatbot(
            @Param("maxPrice") Double maxPrice,
            @Param("phuong") String phuong,
            Pageable pageable
    );
}
