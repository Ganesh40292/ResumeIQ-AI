package com.resumeiq.service;

import com.resumeiq.dto.request.ResumeBuilderRequest;
import com.resumeiq.dto.response.ResumeBuilderResponse;
import com.resumeiq.entity.ParsedResume;
import com.resumeiq.entity.Resume;
import com.resumeiq.entity.ResumeVersion;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.ParsedResumeRepository;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.ResumeVersionRepository;
import com.resumeiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeBuilderService {

    private final ResumeRepository resumeRepository;
    private final ParsedResumeRepository parsedResumeRepository;
    private final ResumeVersionRepository resumeVersionRepository;
    private final UserRepository userRepository;
    private final ResumeVersionService resumeVersionService;

    private static final String DEFAULT_EMPTY_JSON = 
        "{\"personalInfo\":{\"fullName\":\"Your Name\",\"email\":\"email@example.com\",\"phone\":\"\",\"location\":\"\",\"linkedin\":\"\",\"github\":\"\",\"portfolio\":\"\",\"professionalSummary\":\"\"},\"education\":[],\"skills\":{\"programmingLanguages\":[],\"frameworks\":[],\"libraries\":[],\"databases\":[],\"cloud\":[],\"devops\":[],\"tools\":[],\"softSkills\":[]},\"experience\":[],\"internships\":[],\"projects\":[],\"certifications\":[],\"achievements\":[],\"languages\":[]}";

    @Transactional
    public ResumeBuilderResponse getResumeState(UUID resumeId, String email) {
        User user = getUserByEmail(email);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // 1. Check if a version checkpoint already exists
        var latestOpt = resumeVersionRepository.findFirstByResumeIdOrderByVersionNumberDesc(resume.getId());
        if (latestOpt.isPresent()) {
            ResumeVersion latest = latestOpt.get();
            return ResumeBuilderResponse.builder()
                    .resumeId(resume.getId())
                    .resumeJson(latest.getResumeJson())
                    .updatedAt(latest.getUpdatedAt())
                    .build();
        }

        // 2. If no version exists, fallback to Parsed Resume JSON from Phase 5
        String resumeJson = DEFAULT_EMPTY_JSON;
        var parsedOpt = parsedResumeRepository.findByResumeId(resume.getId());
        if (parsedOpt.isPresent() && parsedOpt.get().getStatus() == com.resumeiq.entity.ParsingStatus.COMPLETED) {
            resumeJson = parsedOpt.get().getParsedJson();
        } else {
            // Pre-fill name from resume metadata title if possible
            resumeJson = DEFAULT_EMPTY_JSON.replace("Your Name", cleanTitleToName(resume.getResumeTitle()))
                                            .replace("email@example.com", email);
        }

        // Save as version 1 checkpoint baseline
        resumeVersionService.createVersion(resume.getId(), "Initial Version", resumeJson, email);

        return ResumeBuilderResponse.builder()
                .resumeId(resume.getId())
                .resumeJson(resumeJson)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Transactional
    public ResumeBuilderResponse saveResumeState(ResumeBuilderRequest request, String email) {
        User user = getUserByEmail(email);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(request.getResumeId(), user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Find or create version 1 checkpoint to update
        ResumeVersion version = resumeVersionRepository.findFirstByResumeIdOrderByVersionNumberDesc(resume.getId())
                .orElseGet(() -> ResumeVersion.builder()
                        .resumeId(resume.getId())
                        .versionName("Baseline Save")
                        .versionNumber(1)
                        .createdBy(email)
                        .createdAt(LocalDateTime.now())
                        .build());

        version.setResumeJson(request.getResumeJson());
        version.setUpdatedAt(LocalDateTime.now());
        ResumeVersion saved = resumeVersionRepository.save(version);

        return ResumeBuilderResponse.builder()
                .resumeId(resume.getId())
                .resumeJson(saved.getResumeJson())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private String cleanTitleToName(String title) {
        if (title == null || title.isEmpty()) return "Your Name";
        String clean = title.replaceAll("(?i)\\.(pdf|docx|doc)$", "")
                            .replace('-', ' ')
                            .replace('_', ' ');
        return clean.trim();
    }
}
