package com.resumeiq.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeUpdateRequest {

    @NotBlank(message = "Resume title is required")
    private String resumeTitle;
}
