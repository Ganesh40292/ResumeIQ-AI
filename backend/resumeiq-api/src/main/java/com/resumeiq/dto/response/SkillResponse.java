package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillResponse {
    private List<String> programmingLanguages;
    private List<String> frameworks;
    private List<String> libraries;
    private List<String> databases;
    private List<String> cloud;
    private List<String> devops;
    private List<String> tools;
    private List<String> softSkills;
}
