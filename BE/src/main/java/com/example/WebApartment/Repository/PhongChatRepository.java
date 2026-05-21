package com.example.WebApartment.Repository;

import com.example.WebApartment.Models.PhongChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhongChatRepository extends JpaRepository<PhongChat, String> {

    List<PhongChat> findByNguoiDung1_MaNguoiDungOrNguoiDung2_MaNguoiDungOrderByThoiGianTinNhanCuoiDesc(
            String maNguoiDung1,
            String maNguoiDung2
    );

    Optional<PhongChat> findByNguoiDung1_MaNguoiDungAndNguoiDung2_MaNguoiDungAndLoaiPhongChat(
            String maNguoiDung1,
            String maNguoiDung2,
            String loaiPhongChat
    );

    Optional<PhongChat> findByNguoiDung2_MaNguoiDungAndNguoiDung1_MaNguoiDungAndLoaiPhongChat(
            String maNguoiDung2,
            String maNguoiDung1,
            String loaiPhongChat
    );
}