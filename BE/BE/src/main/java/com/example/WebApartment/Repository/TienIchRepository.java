package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.TienIch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TienIchRepository extends JpaRepository<TienIch, String> {

    boolean existsByTenTienIch(String tenTienIch);
}