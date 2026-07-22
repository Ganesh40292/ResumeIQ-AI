package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeParsedResponse {
    private PersonalInfoResponse personalInfo;
    private List<EducationResponse> education;
    private SkillResponse skills;
    private List<ProjectResponse> projects;
    private List<ExperienceResponse> experience;
    private List<ExperienceResponse> internships;
    private List<CertificationResponse> certifications;
    private List<String> achievements;
    private List<String> languages;
}
