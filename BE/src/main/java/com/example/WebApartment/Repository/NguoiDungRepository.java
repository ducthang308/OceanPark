package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, String> {

    Optional<NguoiDung> findByEmail(String email);

    boolean existsByEmail(String email);

    NguoiDung findBySoDienThoai(String soDienThoai);

    boolean existsBySoDienThoai(String soDienThoai);

    long countByVaiTro_MaVaiTro(String maVaiTro);

    @Query("SELECT nd.maNguoiDung FROM NguoiDung nd ORDER BY nd.maNguoiDung DESC")
    List<String> findTopMaNguoiDung(Pageable pageable);
}
