package com.resumeiq.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeUploadRequest {
    private String resumeTitle;
}
