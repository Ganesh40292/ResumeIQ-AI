package com.resumeiq.controller;

import com.resumeiq.dto.request.InterviewEvaluationRequest;
import com.resumeiq.dto.request.InterviewSessionRequest;
import com.resumeiq.dto.response.*;
import com.resumeiq.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/session")
    public ResponseEntity<ApiResponse<InterviewSessionResponse>> startSession(@RequestBody InterviewSessionRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        InterviewSessionResponse response = interviewService.startSession(request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Mock interview session started and questions generated", response));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> evaluateSession(@RequestBody InterviewEvaluationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        InterviewSummaryResponse response = interviewService.evaluateSession(request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Interview evaluated and graded successfully", response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<InterviewSessionResponse>>> getHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<InterviewSessionResponse> response = interviewService.getHistory(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Interview sessions history retrieved successfully", response));
    }

    @GetMapping("/report/{sessionId}")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> getReport(@PathVariable UUID sessionId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        InterviewSummaryResponse response = interviewService.getReport(sessionId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Interview report card retrieved successfully", response));
    }
}
