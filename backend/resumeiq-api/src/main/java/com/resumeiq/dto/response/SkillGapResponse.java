package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillGapResponse {
    private List<String> criticalSkills; // missing required skills
    private List<String> importantSkills; // missing preferred skills
    private List<String> optionalSkills; // missing minor keywords from JD text
}
