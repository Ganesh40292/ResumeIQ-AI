package com.resumeiq.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSessionResponse {
    private UUID id;
    private UUID userId;
    private UUID resumeId;
    private UUID jobDescriptionId;
    private String interviewType;
    private String targetRole;
    private String difficulty;
    private String status;
    private Integer score;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<InterviewQuestionResponse> questions;
}
