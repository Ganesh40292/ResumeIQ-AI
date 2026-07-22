package com.resumeiq.controller;

import com.resumeiq.dto.request.JobMatchRequest;
import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.JobMatchResponse;
import com.resumeiq.entity.JobMatchReport;
import com.resumeiq.entity.Resume;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.JobMatchReportRepository;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.UserRepository;
import com.resumeiq.service.JobMatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/job-matcher")
@RequiredArgsConstructor
public class JobMatcherController {

    private final JobMatchingService jobMatchingService;
    private final JobMatchReportRepository jobMatchReportRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<JobMatchResponse>> analyzeMatch(@RequestBody JobMatchRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        JobMatchResponse response = jobMatchingService.analyzeMatch(request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Job description match report generated successfully", response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<JobMatchResponse>>> getHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<JobMatchResponse> history = jobMatchingService.getHistory(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Job match history logs fetched successfully", history));
    }

    @DeleteMapping("/report/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        JobMatchReport report = jobMatchReportRepository.findById(id)
                .orElseThrow(() -> new CustomException("Match report not found", HttpStatus.NOT_FOUND));

        // Verify that the user owns the resume associated with this report
        Resume resume = resumeRepository.findById(report.getResumeId())
                .orElseThrow(() -> new CustomException("Associated resume not found", HttpStatus.NOT_FOUND));

        if (!resume.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        jobMatchReportRepository.delete(report);
        return ResponseEntity.ok(new ApiResponse<>(true, "Match report deleted successfully", null));
    }
}
