package com.resumeiq.controller;

import com.resumeiq.dto.request.ResumeUpdateRequest;
import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.ResumeResponse;
import com.resumeiq.dto.response.ResumeSummaryResponse;
import com.resumeiq.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ResumeResponse>> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "resumeTitle", required = false) String resumeTitle
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeResponse response = resumeService.uploadResume(file, resumeTitle, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume uploaded successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResumeSummaryResponse>>> getAllResumes() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ResumeSummaryResponse> response = resumeService.getAllResumes(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resumes fetched successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResumeResponse>> getResumeById(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeResponse response = resumeService.getResumeById(id, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume metadata fetched successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResumeResponse>> updateResume(
            @PathVariable UUID id,
            @Valid @RequestBody ResumeUpdateRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeResponse response = resumeService.updateResume(id, request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        resumeService.deleteResume(id, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume deleted successfully", null));
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<ApiResponse<ResumeResponse>> setDefaultResume(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeResponse response = resumeService.setDefaultResume(id, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Default resume set successfully", response));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadResume(@PathVariable UUID id) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Resource resource = resumeService.downloadResume(id, email);

        // Fetch file type and filename from database metadata to set proper headers
        ResumeResponse meta = resumeService.getResumeById(id, email);

        String contentType = meta.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getOriginalFileName() + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(resource);
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ResumeResponse>> restoreResume(@PathVariable UUID id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeResponse response = resumeService.restoreResume(id, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume restored successfully", response));
    }
}
