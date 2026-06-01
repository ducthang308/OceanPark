package com.example.WebApartment.Service;

import com.example.WebApartment.Repository.NguoiDungRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NguoiDungCodeServiceTest {

    @Mock
    private NguoiDungRepository nguoiDungRepository;

    @InjectMocks
    private NguoiDungCodeService nguoiDungCodeService;

    @Test
    void generateMaNguoiDungComparesNumericSuffix() {
        when(nguoiDungRepository.findAllMaNguoiDung())
                .thenReturn(List.of("ND1", "ND2", "ND9", "ND10", "ND11"));

        assertEquals("ND12", nguoiDungCodeService.generateMaNguoiDung());
    }

    @Test
    void generateMaNguoiDungIgnoresInvalidExistingIds() {
        when(nguoiDungRepository.findAllMaNguoiDung())
                .thenReturn(Arrays.asList("CF0E4E3B60", "NDABC", "ND", "ND10A", null, "ND5"));

        assertEquals("ND6", nguoiDungCodeService.generateMaNguoiDung());
    }

    @Test
    void generateMaNguoiDungStartsAtOneWhenNoValidIdsExist() {
        when(nguoiDungRepository.findAllMaNguoiDung())
                .thenReturn(List.of("CF0E4E3B60", "NDABC", "USER1"));

        assertEquals("ND1", nguoiDungCodeService.generateMaNguoiDung());
    }
}
