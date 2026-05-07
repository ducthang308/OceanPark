package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.GiaoDich;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GiaoDichRepository extends JpaRepository<GiaoDich, String> {
    boolean existsByProviderTransactionNo(String providerTransactionNo);
}