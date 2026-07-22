package com.resumeiq.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String profilePicture;
    private String role;
    private String status;
    private boolean emailVerified;
    private LocalDateTime createdAt;
}
