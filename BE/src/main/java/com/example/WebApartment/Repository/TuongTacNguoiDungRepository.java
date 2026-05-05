package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.TuongTacNguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.stereotype.Repository;

@Repository
public interface TuongTacNguoiDungRepository extends JpaRepository<TuongTacNguoiDung, String> {
}