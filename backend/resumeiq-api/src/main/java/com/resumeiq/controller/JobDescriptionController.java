package com.resumeiq.controller;

import com.resumeiq.dto.request.JobDescriptionRequest;
import com.resumeiq.dto.response.ApiResponse;
import com.resumeiq.dto.response.JobDescriptionResponse;
import com.resumeiq.entity.JobDescription;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.JobDescriptionRepository;
import com.resumeiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/job-descriptions")
@RequiredArgsConstructor
public class JobDescriptionController {

    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobDescriptionResponse>>> getJobDescriptions() {
        User user = getCurrentUser();
        List<JobDescription> list = jobDescriptionRepository.findByUserId(user.getId());
        List<JobDescriptionResponse> responses = list.stream().map(this::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(true, "Job descriptions fetched successfully", responses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<JobDescriptionResponse>> createJobDescription(@RequestBody JobDescriptionRequest request) {
        User user = getCurrentUser();
        
        JobDescription jd = JobDescription.builder()
                .userId(user.getId())
                .jobTitle(request.getJobTitle())
                .companyName(request.getCompanyName() != null ? request.getCompanyName() : "Target Company")
                .location(request.getLocation())
                .employmentType(request.getEmploymentType())
                .experienceRequired(request.getExperienceRequired() != null ? request.getExperienceRequired() : 0)
                .jobDescription(request.getJobDescription())
                .requiredSkills(request.getRequiredSkills())
                .preferredSkills(request.getPreferredSkills())
                .createdAt(LocalDateTime.now())
                .build();

        JobDescription saved = jobDescriptionRepository.save(jd);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Job description saved successfully", mapToResponse(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDescriptionResponse>> updateJobDescription(
            @PathVariable UUID id, 
            @RequestBody JobDescriptionRequest request) {
        User user = getCurrentUser();
        JobDescription jd = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new CustomException("Job description not found", HttpStatus.NOT_FOUND));

        if (!jd.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        jd.setJobTitle(request.getJobTitle());
        jd.setCompanyName(request.getCompanyName() != null ? request.getCompanyName() : jd.getCompanyName());
        jd.setLocation(request.getLocation());
        jd.setEmploymentType(request.getEmploymentType());
        jd.setExperienceRequired(request.getExperienceRequired() != null ? request.getExperienceRequired() : 0);
        jd.setJobDescription(request.getJobDescription());
        jd.setRequiredSkills(request.getRequiredSkills());
        jd.setPreferredSkills(request.getPreferredSkills());
        jd.setUpdatedAt(LocalDateTime.now());

        JobDescription updated = jobDescriptionRepository.save(jd);
        return ResponseEntity.ok(new ApiResponse<>(true, "Job description updated successfully", mapToResponse(updated)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteJobDescription(@PathVariable UUID id) {
        User user = getCurrentUser();
        JobDescription jd = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new CustomException("Job description not found", HttpStatus.NOT_FOUND));

        if (!jd.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        jobDescriptionRepository.delete(jd);
        return ResponseEntity.ok(new ApiResponse<>(true, "Job description deleted successfully", null));
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private JobDescriptionResponse mapToResponse(JobDescription jd) {
        return JobDescriptionResponse.builder()
                .id(jd.getId())
                .userId(jd.getUserId())
                .jobTitle(jd.getJobTitle())
                .companyName(jd.getCompanyName())
                .location(jd.getLocation())
                .employmentType(jd.getEmploymentType())
                .experienceRequired(jd.getExperienceRequired())
                .jobDescription(jd.getJobDescription())
                .requiredSkills(jd.getRequiredSkills())
                .preferredSkills(jd.getPreferredSkills())
                .createdAt(jd.getCreatedAt())
                .updatedAt(jd.getUpdatedAt())
                .build();
    }
}
