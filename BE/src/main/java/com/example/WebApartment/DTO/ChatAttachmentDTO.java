package com.example.WebApartment.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatAttachmentDTO {
    private String url;
    private String originalName;
    private String contentType;
    private Long size;
}
