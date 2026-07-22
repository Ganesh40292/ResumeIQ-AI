package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerProgressResponse {
    private List<ProgressPoint> progressTimeline;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProgressPoint {
        private String name; // e.g. "Draft 1", "Session 1"
        private Integer atsScore;
        private Integer interviewScore;
        private Integer jobMatchScore;
    }
}
