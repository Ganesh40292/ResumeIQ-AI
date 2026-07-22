package com.resumeiq.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeBuilderResponse {
    private UUID resumeId;
    private String resumeJson;
    private LocalDateTime updatedAt;
}
