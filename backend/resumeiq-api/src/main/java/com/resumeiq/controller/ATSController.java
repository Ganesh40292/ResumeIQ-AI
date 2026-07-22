package com.resumeiq.controller;

import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.ATSReportResponse;
import com.resumeiq.service.ATSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ats")
@RequiredArgsConstructor
public class ATSController {

    private final ATSService atsService;

    @PostMapping("/analyze/{resumeId}")
    public ResponseEntity<ApiResponse<ATSReportResponse>> analyzeResume(@PathVariable UUID resumeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ATSReportResponse report = atsService.analyzeResume(resumeId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "ATS report generated successfully", report));
    }

    @GetMapping("/report/{resumeId}")
    public ResponseEntity<ApiResponse<ATSReportResponse>> getATSReport(@PathVariable UUID resumeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ATSReportResponse report = atsService.getATSReport(resumeId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "ATS report fetched successfully", report));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ATSReportResponse>>> getHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ATSReportResponse> history = atsService.getHistory(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "ATS analysis history fetched successfully", history));
    }
}
