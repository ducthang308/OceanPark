package com.example.WebApartment.Service;

import com.example.WebApartment.Models.NguoiDung;
import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final NguoiDungRepository nguoiDungRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        NguoiDung nguoiDung = nguoiDungRepository.findBySoDienThoai(username);

        if (nguoiDung == null) {
            throw new UsernameNotFoundException("Không tìm thấy người dùng với số điện thoại: " + username);
        }

        return nguoiDung;
    }
}