package com.resumeiq.dto.response;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestionResponse {
    private UUID id;
    private UUID sessionId;
    private String question;
    private String category;
    private String difficulty;
    private String expectedAnswer;
    private String hints;
}
