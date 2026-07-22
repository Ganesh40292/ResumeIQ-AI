package com.resumeiq.dto.response;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeTemplateResponse {
    private UUID id;
    private String templateName;
    private String templateCategory;
    private String primaryColor;
    private String secondaryColor;
    private String font;
    private String previewImage;
    private Boolean isPremium;
}
