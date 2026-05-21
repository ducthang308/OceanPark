package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.TinNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TinNhanRepository extends JpaRepository<TinNhan, String> {

    List<TinNhan> findByPhongChat_MaPhongChatOrderByThoiGianGuiAsc(String maPhongChat);
}