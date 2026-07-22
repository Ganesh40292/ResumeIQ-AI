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
public class InterviewSummaryResponse {
    private UUID sessionId;
    private String targetRole;
    private String difficulty;
    private Integer overallScore;
    private List<InterviewFeedbackResponse> evaluations;
    private String strengths;
    private String weaknesses;
    private String learningRoadmap;
    private LocalDateTime completedAt;
}
