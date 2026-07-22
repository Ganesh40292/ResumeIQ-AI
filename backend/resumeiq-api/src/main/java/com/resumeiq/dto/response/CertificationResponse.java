package com.resumeiq.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificationResponse {
    private String certificationName;
    private String organization;
    private String date;
}
