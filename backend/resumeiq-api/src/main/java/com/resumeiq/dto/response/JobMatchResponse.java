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
public class JobMatchResponse {
    private UUID id;
    private UUID resumeId;
    private UUID jobDescriptionId;
    private String jobTitle;
    private String companyName;
    private Integer overallMatchScore;
    private Integer skillsMatchScore;
    private Integer experienceMatchScore;
    private Integer educationMatchScore;
    private Integer keywordMatchScore;
    private List<String> strengths;
    private List<String> weaknesses;
    private SkillGapResponse skillGap;
    private String recommendations; // Gemini markdown explanation
    private LocalDateTime createdAt;
}
