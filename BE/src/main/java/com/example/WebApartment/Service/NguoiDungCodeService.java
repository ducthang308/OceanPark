package com.example.WebApartment.Service;

import com.example.WebApartment.Repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.OptionalInt;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class NguoiDungCodeService {

    private static final String PREFIX = "ND";
    private static final Pattern MA_NGUOI_DUNG_PATTERN = Pattern.compile("^ND(\\d+)$");

    private final NguoiDungRepository nguoiDungRepository;

    public String generateMaNguoiDung() {
        int maxNumber = nguoiDungRepository.findAllMaNguoiDung()
                .stream()
                .map(this::extractNumber)
                .flatMapToInt(OptionalInt::stream)
                .max()
                .orElse(0);

        return PREFIX + (maxNumber + 1);
    }

    private OptionalInt extractNumber(String maNguoiDung) {
        if (maNguoiDung == null) {
            return OptionalInt.empty();
        }

        Matcher matcher = MA_NGUOI_DUNG_PATTERN.matcher(maNguoiDung);
        if (!matcher.matches()) {
            return OptionalInt.empty();
        }

        try {
            return OptionalInt.of(Integer.parseInt(matcher.group(1)));
        } catch (NumberFormatException ex) {
            return OptionalInt.empty();
        }
    }
}
