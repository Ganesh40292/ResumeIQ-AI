package com.resumeiq.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationResponse {
    private String college;
    private String degree;
    private String branch;
    private String cgpa;
    private String percentage;
    private String startYear;
    private String endYear;
}
