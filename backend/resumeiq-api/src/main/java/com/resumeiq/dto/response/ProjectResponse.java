package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {
    private String projectName;
    private String description;
    private List<String> technologies;
    private String duration;
    private String githubLink;
}
