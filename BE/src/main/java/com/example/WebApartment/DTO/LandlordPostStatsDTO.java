package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordPostStatsDTO {
    private String maBaiDang;
    private String tieuDe;
    private String trangThai;
    private Double gia;
    private Long viewCount;
    private Long likeCount;
    private Double revenue;
}