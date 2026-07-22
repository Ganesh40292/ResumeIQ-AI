package com.resumeiq.dto.request;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewEvaluationRequest {
    private UUID sessionId;
    private List<InterviewResponseRequest> answers;
}
