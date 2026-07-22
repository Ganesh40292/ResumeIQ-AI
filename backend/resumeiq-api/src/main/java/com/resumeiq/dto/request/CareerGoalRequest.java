package com.resumeiq.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerGoalRequest {
    private String title;
    private Integer progress;
    private Boolean completed;
}
