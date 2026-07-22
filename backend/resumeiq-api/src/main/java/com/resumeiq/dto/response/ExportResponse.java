package com.resumeiq.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportResponse {
    private String downloadUrl;
}
