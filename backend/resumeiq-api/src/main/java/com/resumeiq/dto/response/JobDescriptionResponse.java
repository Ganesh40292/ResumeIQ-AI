package com.resumeiq.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDescriptionResponse {
    private UUID id;
    private UUID userId;
    private String jobTitle;
    private String companyName;
    private String location;
    private String employmentType;
    private Integer experienceRequired;
    private String jobDescription;
    private String requiredSkills;
    private String preferredSkills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
