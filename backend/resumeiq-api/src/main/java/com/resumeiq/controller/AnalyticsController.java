package com.resumeiq.controller;

import com.resumeiq.dto.request.CareerGoalRequest;
import com.resumeiq.dto.response.*;
import com.resumeiq.service.AnalyticsService;
import com.resumeiq.service.ProgressTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ProgressTrackingService progressTrackingService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AnalyticsSummaryResponse>> getDashboardSummary() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        AnalyticsSummaryResponse summary = analyticsService.getDashboardSummary(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Analytics dashboard summary fetched successfully", summary));
    }

    @GetMapping("/career-progress")
    public ResponseEntity<ApiResponse<CareerProgressResponse>> getCareerProgress() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        CareerProgressResponse progress = analyticsService.getCareerProgress(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Career progress timelines fetched successfully", progress));
    }

    @GetMapping("/goals")
    public ResponseEntity<ApiResponse<List<CareerGoalResponse>>> getGoals() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<CareerGoalResponse> goals = progressTrackingService.getGoals(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Career goals fetched successfully", goals));
    }

    @PostMapping("/goals")
    public ResponseEntity<ApiResponse<CareerGoalResponse>> createGoal(@RequestBody CareerGoalRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        CareerGoalResponse goal = progressTrackingService.createGoal(request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Career goal created successfully", goal));
    }

    @PutMapping("/goals/{id}")
    public ResponseEntity<ApiResponse<CareerGoalResponse>> updateGoal(
            @PathVariable UUID id, 
            @RequestBody CareerGoalRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        CareerGoalResponse goal = progressTrackingService.updateGoal(id, request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Career goal updated successfully", goal));
    }

    @DeleteMapping("/goals/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        progressTrackingService.deleteGoal(id, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Career goal deleted successfully", null));
    }
}
