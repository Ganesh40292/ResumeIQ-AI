package com.resumeiq.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeVersionResponse {
    private UUID id;
    private UUID resumeId;
    private String versionName;
    private Integer versionNumber;
    private String resumeJson;
    private String createdBy;
    private LocalDateTime createdAt;
}
