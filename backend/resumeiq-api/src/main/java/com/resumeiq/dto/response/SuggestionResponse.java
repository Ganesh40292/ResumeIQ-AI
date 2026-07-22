package com.resumeiq.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestionResponse {
    private String priority; // HIGH, MEDIUM, LOW
    private String message;
    private String section;
    private boolean completed;
}
