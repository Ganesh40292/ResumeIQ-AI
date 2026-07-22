package com.resumeiq.dto.request;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSessionRequest {
    private UUID resumeId;
    private UUID jobDescriptionId;
    private String interviewType; // TECHNICAL, BEHAVIORAL, HR, SYSTEM_DESIGN
    private String targetRole;
    private String difficulty; // EASY, MEDIUM, HARD
}
