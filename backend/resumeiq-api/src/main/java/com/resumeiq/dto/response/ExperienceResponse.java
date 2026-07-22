package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExperienceResponse {
    private String company;
    private String role;
    private String duration;
    private List<String> responsibilities;
}
