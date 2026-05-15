package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.NhuCauNguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NhuCauNguoiDungRepository extends JpaRepository<NhuCauNguoiDung, String> {

    Optional<NhuCauNguoiDung>
    findTopByNguoiDung_MaNguoiDungOrderByNgayTaoDesc(
            String maNguoiDung
    );
}
