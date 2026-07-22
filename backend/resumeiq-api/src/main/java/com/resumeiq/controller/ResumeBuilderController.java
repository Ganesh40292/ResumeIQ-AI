package com.resumeiq.controller;

import com.resumeiq.dto.request.ResumeBuilderRequest;
import com.resumeiq.dto.response.*;
import com.resumeiq.service.ResumeBuilderService;
import com.resumeiq.service.ResumeExportService;
import com.resumeiq.service.ResumeTemplateService;
import com.resumeiq.service.ResumeVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resume-builder")
@RequiredArgsConstructor
public class ResumeBuilderController {

    private final ResumeBuilderService resumeBuilderService;
    private final ResumeTemplateService resumeTemplateService;
    private final ResumeVersionService resumeVersionService;
    private final ResumeExportService resumeExportService;

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<List<ResumeTemplateResponse>>> getTemplates() {
        List<ResumeTemplateResponse> templates = resumeTemplateService.getTemplates();
        return ResponseEntity.ok(new ApiResponse<>(true, "Templates retrieved successfully", templates));
    }

    @GetMapping("/{resumeId}")
    public ResponseEntity<ApiResponse<ResumeBuilderResponse>> getResumeState(@PathVariable UUID resumeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeBuilderResponse state = resumeBuilderService.getResumeState(resumeId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume builder state retrieved", state));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<ResumeBuilderResponse>> saveResumeState(@RequestBody ResumeBuilderRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeBuilderResponse state = resumeBuilderService.saveResumeState(request, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume state saved successfully", state));
    }

    @PostMapping("/version")
    public ResponseEntity<ApiResponse<ResumeVersionResponse>> createVersion(@RequestBody ResumeBuilderRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ResumeVersionResponse version = resumeVersionService.createVersion(
                request.getResumeId(), request.getVersionName(), request.getResumeJson(), email
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume version checkpoint created", version));
    }

    @GetMapping("/version-history")
    public ResponseEntity<ApiResponse<List<ResumeVersionResponse>>> getVersionHistory(@RequestParam UUID resumeId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ResumeVersionResponse> history = resumeVersionService.getHistory(resumeId, email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Version checkpoints history retrieved", history));
    }

    @PostMapping("/export/docx")
    public ResponseEntity<byte[]> exportDocx(@RequestBody ResumeBuilderRequest request) {
        byte[] docxBytes = resumeExportService.exportToDocx(request.getResumeJson());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        headers.setContentDispositionFormData("attachment", "resume_export.docx");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(docxBytes);
    }

    @PostMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestBody ResumeBuilderRequest request) {
        // PDF generation placeholders
        byte[] pdfBytes = "PDF Byte Stream".getBytes();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "resume_export.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
