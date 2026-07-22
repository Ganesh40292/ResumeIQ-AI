package com.resumeiq.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeywordAnalysisResponse {
    private List<String> detectedKeywords;
    private List<String> missingKeywords;
    private List<String> suggestedKeywords;
}
