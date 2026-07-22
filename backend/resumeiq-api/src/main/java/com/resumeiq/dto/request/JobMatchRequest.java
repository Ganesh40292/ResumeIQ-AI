package com.resumeiq.dto.request;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobMatchRequest {
    private UUID resumeId;
    private UUID jobDescriptionId;
    private JobDescriptionRequest jobDetails; // direct inputs if unsaved
}
