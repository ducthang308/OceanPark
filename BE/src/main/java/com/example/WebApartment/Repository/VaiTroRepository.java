package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.VaiTro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface VaiTroRepository extends JpaRepository<VaiTro, String> {
    boolean existsByTenVaiTro(String tenVaiTro);
}
