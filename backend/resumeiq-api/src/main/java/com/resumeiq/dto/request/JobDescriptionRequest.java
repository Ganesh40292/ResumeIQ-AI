package com.resumeiq.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDescriptionRequest {
    private String jobTitle;
    private String companyName;
    private String location;
    private String employmentType;
    private Integer experienceRequired;
    private String jobDescription;
    private String requiredSkills;
    private String preferredSkills;
}
