package com.resumeiq.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeSummaryResponse {
    private UUID id;
    private String resumeTitle;
    private String originalFileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadDate;
    private boolean isDefaultResume;
}
