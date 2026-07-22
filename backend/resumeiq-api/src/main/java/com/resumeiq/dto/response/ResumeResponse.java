package com.resumeiq.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeResponse {
    private UUID id;
    private UUID userId;
    private String originalFileName;
    private String fileType;
    private Long fileSize;
    private String fileExtension;
    private LocalDateTime uploadDate;
    private LocalDateTime lastModified;
    private String resumeTitle;
    private Integer resumeVersion;
    private boolean isDefaultResume;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
