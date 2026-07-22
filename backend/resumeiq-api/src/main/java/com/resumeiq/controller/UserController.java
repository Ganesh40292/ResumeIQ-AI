package com.resumeiq.controller;

import com.resumeiq.dto.request.ChangePasswordRequest;
import com.resumeiq.dto.request.UpdateProfileRequest;
import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.UserResponse;
import com.resumeiq.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserResponse response = userService.getProfile(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile fetched successfully", response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserResponse response = userService.updateProfile(email, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully", response));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Password changed successfully", null));
    }

    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.deleteAccount(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Account deleted successfully", null));
    }
}
