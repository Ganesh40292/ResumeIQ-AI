package com.resumeiq.dto.response;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewFeedbackResponse {
    private UUID id;
    private UUID questionId;
    private String question;
    private String userResponse;
    private String aiFeedback;
    private Integer score;
    private String improvementSuggestions;
}
