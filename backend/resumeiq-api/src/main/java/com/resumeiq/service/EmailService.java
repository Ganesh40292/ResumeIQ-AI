package com.resumeiq.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    public void sendResetPasswordEmail(String email, String token) {
        log.info("Sending password reset email to: {} with token: {}", email, token);
        // Simulate email sending
        System.out.println("--------------------------------------------------");
        System.out.println("EMAIL SENT TO: " + email);
        System.out.println("PASSWORD RESET LINK: http://localhost:5173/reset-password?token=" + token);
        System.out.println("--------------------------------------------------");
    }
}
