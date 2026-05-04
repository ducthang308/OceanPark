package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, String> {

    NguoiDung findByEmail(String email);

    boolean existsByEmail(String email);
}
