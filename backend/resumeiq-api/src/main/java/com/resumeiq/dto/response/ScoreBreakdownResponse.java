package com.resumeiq.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreBreakdownResponse {
    private Integer formatting;
    private Integer education;
    private Integer experience;
    private Integer projects;
    private Integer skills;
    private Integer keywords;
    private Integer achievements;
    private Integer readability;
    private Integer structure;
}
