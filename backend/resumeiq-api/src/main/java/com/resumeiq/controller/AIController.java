package com.resumeiq.controller;

import com.resumeiq.dto.request.AIRequest;
import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.AIResponse;
import com.resumeiq.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/review/{resumeId}")
    public ResponseEntity<ApiResponse<AIResponse>> reviewResume(
            @PathVariable UUID resumeId,
            @RequestBody(required = false) AIRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String prefs = request != null ? request.getAdditionalPreferences() : null;
        AIResponse response = aiService.generateReview(resumeId, "RESUME_REVIEW", prefs, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "AI resume audit generated successfully", response));
    }

    @PostMapping("/projects/{resumeId}")
    public ResponseEntity<ApiResponse<AIResponse>> reviewProjects(
            @PathVariable UUID resumeId,
            @RequestBody(required = false) AIRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String prefs = request != null ? request.getAdditionalPreferences() : null;
        AIResponse response = aiService.generateReview(resumeId, "PROJECTS_REVIEW", prefs, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "AI projects rewrite review generated successfully", response));
    }

    @PostMapping("/summary/{resumeId}")
    public ResponseEntity<ApiResponse<AIResponse>> generateSummary(
            @PathVariable UUID resumeId,
            @RequestBody(required = false) AIRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String prefs = request != null ? request.getAdditionalPreferences() : null;
        AIResponse response = aiService.generateReview(resumeId, "SUMMARY_GEN", prefs, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "AI summary statement recommendations generated", response));
    }

    @PostMapping("/skills/{resumeId}")
    public ResponseEntity<ApiResponse<AIResponse>> recommendSkills(
            @PathVariable UUID resumeId,
            @RequestBody(required = false) AIRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String prefs = request != null ? request.getAdditionalPreferences() : null;
        AIResponse response = aiService.generateReview(resumeId, "SKILLS_REC", prefs, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "AI skills roadmap generated", response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AIResponse>>> getHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<AIResponse> history = aiService.getHistory(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "AI review history fetched successfully", history));
    }
}
