package com.resumeiq.controller;

import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.ResumeParsedResponse;
import com.resumeiq.service.ResumeParserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/parser")
@RequiredArgsConstructor
public class ResumeParserController {

    private final ResumeParserService resumeParserService;

    @PostMapping("/{resumeId}")
    public ResponseEntity<ApiResponse<ResumeParsedResponse>> parseResume(@PathVariable UUID resumeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeParsedResponse parsedData = resumeParserService.parseResume(resumeId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume parsed successfully", parsedData));
    }

    @GetMapping("/{resumeId}")
    public ResponseEntity<ApiResponse<ResumeParsedResponse>> getParsedResume(@PathVariable UUID resumeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeParsedResponse parsedData = resumeParserService.getParsedResume(resumeId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Parsed data retrieved successfully", parsedData));
    }
}
