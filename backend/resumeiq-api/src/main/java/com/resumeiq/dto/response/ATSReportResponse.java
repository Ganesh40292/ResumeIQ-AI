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
public class ATSReportResponse {
    private UUID id;
    private UUID resumeId;
    private String resumeTitle;
    private Integer overallScore;
    private ScoreBreakdownResponse scoreBreakdown;
    private KeywordAnalysisResponse keywordAnalysis;
    private List<SuggestionResponse> suggestions;
    private LocalDateTime createdAt;
}
