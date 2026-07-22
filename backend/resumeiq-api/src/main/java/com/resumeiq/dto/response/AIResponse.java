package com.resumeiq.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIResponse {
    private UUID id;
    private UUID resumeId;
    private String reviewType;
    private String responseMarkdown;
    private Long processingTime;
    private LocalDateTime createdAt;
}
