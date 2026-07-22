package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsSummaryResponse {
    private UUID id;
    private UUID userId;
    private Integer currentAtsScore;
    private Integer highestAtsScore;
    private Integer averageAtsScore;
    private Integer totalResumeVersions;
    private Integer totalJobMatches;
    private Integer totalInterviewSessions;
    private Integer averageInterviewScore;
    private String targetRole;
    private Integer profileCompletion;
    private Integer careerReadinessScore; // calculated weighted score
    private List<String> insights;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> studyRecommendations;
}
