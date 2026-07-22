package com.resumeiq.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.ats.ATSScoringEngine;
import com.resumeiq.dto.response.*;
import com.resumeiq.entity.ATSReport;
import com.resumeiq.entity.ParsedResume;
import com.resumeiq.entity.Resume;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.ATSReportRepository;
import com.resumeiq.repository.ParsedResumeRepository;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ATSService {

    private final ResumeRepository resumeRepository;
    private final ParsedResumeRepository parsedResumeRepository;
    private final ATSReportRepository atsReportRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ATSReportResponse analyzeResume(UUID resumeId, String userEmail) {
        User user = getUserByEmail(userEmail);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Get parsed resume
        ParsedResume parsedResume = parsedResumeRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new CustomException("This resume has not been parsed yet. Please run Resume Analysis first.", HttpStatus.BAD_REQUEST));

        if (parsedResume.getStatus() != com.resumeiq.entity.ParsingStatus.COMPLETED) {
            throw new CustomException("Parsed resume data is not ready. Status: " + parsedResume.getStatus(), HttpStatus.BAD_REQUEST);
        }

        try {
            // Deserialize parsed response
            ResumeParsedResponse parsedData = objectMapper.readValue(parsedResume.getParsedJson(), ResumeParsedResponse.class);

            // Compute score breakdown & suggestions
            ATSReportResponse response = ATSScoringEngine.calculateReport(parsedData, resumeId, resume.getResumeTitle());

            // Save report
            ATSReport report = atsReportRepository.findByResumeId(resumeId)
                    .orElse(ATSReport.builder().resumeId(resumeId).build());

            report.setOverallScore(response.getOverallScore());
            report.setFormattingScore(response.getScoreBreakdown().getFormatting());
            report.setEducationScore(response.getScoreBreakdown().getEducation());
            report.setExperienceScore(response.getScoreBreakdown().getExperience());
            report.setProjectsScore(response.getScoreBreakdown().getProjects());
            report.setSkillsScore(response.getScoreBreakdown().getSkills());
            report.setKeywordScore(response.getScoreBreakdown().getKeywords());
            report.setAchievementsScore(response.getScoreBreakdown().getAchievements());
            report.setReadabilityScore(response.getScoreBreakdown().getReadability());
            report.setStructureScore(response.getScoreBreakdown().getStructure());

            report.setKeywordResults(objectMapper.writeValueAsString(response.getKeywordAnalysis()));
            report.setSuggestions(objectMapper.writeValueAsString(response.getSuggestions()));
            report.setUpdatedAt(LocalDateTime.now());
            
            ATSReport saved = atsReportRepository.save(report);
            response.setId(saved.getId());

            return response;

        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to decode structured resume JSON payload: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public ATSReportResponse getATSReport(UUID resumeId, String userEmail) {
        User user = getUserByEmail(userEmail);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        ATSReport report = atsReportRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new CustomException("ATS score report not found. Click Analyze to generate it.", HttpStatus.NOT_FOUND));

        return mapToReportResponse(report, resume.getResumeTitle());
    }

    @Transactional(readOnly = true)
    public List<ATSReportResponse> getHistory(String userEmail) {
        User user = getUserByEmail(userEmail);
        
        // Fetch all active resumes for user
        List<Resume> userResumes = resumeRepository.findByUserIdAndIsDeletedFalse(user.getId(), Sort.unsorted());
        if (userResumes.isEmpty()) {
            return new ArrayList<>();
        }

        List<UUID> resumeIds = userResumes.stream().map(Resume::getId).collect(Collectors.toList());

        // Find reports
        List<ATSReport> reports = atsReportRepository.findByResumeIdIn(resumeIds, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return reports.stream().map(rep -> {
            String title = userResumes.stream()
                    .filter(res -> res.getId().equals(rep.getResumeId()))
                    .findFirst()
                    .map(Resume::getResumeTitle)
                    .orElse("Resume");
            return mapToReportResponse(rep, title);
        }).collect(Collectors.toList());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private ATSReportResponse mapToReportResponse(ATSReport report, String resumeTitle) {
        try {
            KeywordAnalysisResponse kw = objectMapper.readValue(report.getKeywordResults(), KeywordAnalysisResponse.class);
            List<SuggestionResponse> suggestions = objectMapper.readValue(report.getSuggestions(), new TypeReference<List<SuggestionResponse>>() {});

            return ATSReportResponse.builder()
                    .id(report.getId())
                    .resumeId(report.getResumeId())
                    .resumeTitle(resumeTitle)
                    .overallScore(report.getOverallScore())
                    .scoreBreakdown(ScoreBreakdownResponse.builder()
                            .formatting(report.getFormattingScore())
                            .education(report.getEducationScore())
                            .experience(report.getExperienceScore())
                            .projects(report.getProjectsScore())
                            .skills(report.getSkillsScore())
                            .keywords(report.getKeywordScore())
                            .achievements(report.getAchievementsScore())
                            .readability(report.getReadabilityScore())
                            .structure(report.getStructureScore())
                            .build())
                    .keywordAnalysis(kw)
                    .suggestions(suggestions)
                    .createdAt(report.getCreatedAt())
                    .build();
        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to parse persisted JSON records: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
