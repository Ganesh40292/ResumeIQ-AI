package com.resumeiq.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalInfoResponse {
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String linkedin;
    private String github;
    private String portfolio;
}
