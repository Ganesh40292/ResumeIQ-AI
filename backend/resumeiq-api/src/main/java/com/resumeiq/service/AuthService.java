package com.resumeiq.service;

import com.resumeiq.dto.request.LoginRequest;
import com.resumeiq.dto.request.RegisterRequest;
import com.resumeiq.dto.request.ResetPasswordRequest;
import com.resumeiq.dto.response.AuthResponse;
import com.resumeiq.dto.response.TokenResponse;
import com.resumeiq.entity.AccountStatus;
import com.resumeiq.entity.Role;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.UserRepository;
import com.resumeiq.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final UserService userService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email is already registered", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateToken(savedUser.getEmail(), savedUser.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(savedUser.getEmail(), savedUser.getRole().name());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userService.mapToUserResponse(savedUser))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new CustomException("Account is " + user.getStatus().name().toLowerCase(), HttpStatus.FORBIDDEN);
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userService.mapToUserResponse(user))
                .build();
    }

    public TokenResponse refreshToken(String refreshToken) {
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (jwtService.validateToken(refreshToken, user.getEmail())) {
            String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole().name());
            String newRefreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getRole().name());
            return new TokenResponse(newAccessToken, newRefreshToken);
        } else {
            throw new CustomException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED);
        }
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Email not registered", HttpStatus.NOT_FOUND));

        String resetToken = jwtService.generateRefreshToken(user.getEmail(), user.getRole().name());
        emailService.sendResetPasswordEmail(user.getEmail(), resetToken);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = jwtService.extractEmail(request.getToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (!jwtService.validateToken(request.getToken(), user.getEmail())) {
            throw new CustomException("Invalid or expired reset token", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
