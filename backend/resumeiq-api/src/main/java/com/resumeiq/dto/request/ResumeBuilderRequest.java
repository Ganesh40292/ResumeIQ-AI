package com.resumeiq.dto.request;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeBuilderRequest {
    private UUID resumeId;
    private String resumeJson;
    private String versionName; // optional checkpoint name
}
