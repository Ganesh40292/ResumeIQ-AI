package com.resumeiq.dto.request;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewResponseRequest {
    private UUID questionId;
    private String userResponse;
}
