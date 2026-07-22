package com.resumeiq.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.dto.response.*;
import com.resumeiq.entity.ParsedResume;
import com.resumeiq.entity.ParsingStatus;
import com.resumeiq.entity.Resume;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.parser.ResumeParser;
import com.resumeiq.parser.ResumeParsingFactory;
import com.resumeiq.parser.text.KeywordExtractor;
import com.resumeiq.parser.text.ResumeParserUtils;
import com.resumeiq.parser.text.SectionDetector;
import com.resumeiq.parser.text.TextCleaner;
import com.resumeiq.repository.ParsedResumeRepository;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.UserRepository;
import com.resumeiq.storage.local.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeParserService {

    private final ResumeRepository resumeRepository;
    private final ParsedResumeRepository parsedResumeRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ResumeParsingFactory resumeParsingFactory;
    private final ObjectMapper objectMapper;

    @Transactional
    public ResumeParsedResponse parseResume(UUID resumeId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Create or update ParsedResume logging to PROCESSING state
        ParsedResume parsedResume = parsedResumeRepository.findByResumeId(resumeId)
                .orElse(ParsedResume.builder().resumeId(resumeId).build());

        parsedResume.setStatus(ParsingStatus.PROCESSING);
        parsedResume.setErrorMessage(null);
        parsedResume.setUpdatedAt(LocalDateTime.now());
        parsedResume = parsedResumeRepository.save(parsedResume);

        try {
            // Load physical file resource
            Resource resource = fileStorageService.loadFileAsResource(resume.getStoragePath());
            byte[] fileBytes;
            try (InputStream is = resource.getInputStream()) {
                fileBytes = is.readAllBytes();
            }

            if (fileBytes.length == 0) {
                throw new CustomException("The resume file is empty.", HttpStatus.BAD_REQUEST);
            }

            // Get file extension and resolve parser
            String fileExtension = resume.getFileExtension();
            ResumeParser parser = resumeParsingFactory.getParser(fileExtension);

            // Phase 1 & 2: Parse raw text and Clean it
            String rawText = parser.parseToRawText(fileBytes);
            String cleanedText = TextCleaner.clean(rawText);

            // Phase 3 & 4: Detect sections & Extract structured DTO info
            Map<SectionDetector.SectionType, String> sections = SectionDetector.detectSections(cleanedText);
            
            ResumeParsedResponse parsedResponse = extractStructuredData(sections, resume.getOriginalFileName());

            // Phase 5: Serialize output and update entity status
            String json = objectMapper.writeValueAsString(parsedResponse);
            parsedResume.setParsedJson(json);
            parsedResume.setStatus(ParsingStatus.COMPLETED);
            parsedResume.setUpdatedAt(LocalDateTime.now());
            parsedResumeRepository.save(parsedResume);

            return parsedResponse;

        } catch (CustomException ce) {
            markAsFailed(parsedResume, ce.getMessage());
            throw ce;
        } catch (Exception e) {
            log.error("Parsing failed for resume ID: {}", resumeId, e);
            String errorMsg = "An unexpected error occurred during parsing: " + e.getMessage();
            markAsFailed(parsedResume, errorMsg);
            throw new CustomException(errorMsg, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public ResumeParsedResponse getParsedResume(UUID resumeId, String userEmail) {
        User user = getUserByEmail(userEmail);
        // Verify ownership
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        ParsedResume parsedResume = parsedResumeRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new CustomException("Parsed data not found for this resume. Please parse the resume first.", HttpStatus.NOT_FOUND));

        if (parsedResume.getStatus() == ParsingStatus.FAILED) {
            throw new CustomException("Previous parsing execution failed: " + parsedResume.getErrorMessage(), HttpStatus.BAD_REQUEST);
        }

        if (parsedResume.getStatus() == ParsingStatus.PROCESSING) {
            throw new CustomException("Resume parsing is currently in progress. Please check again shortly.", HttpStatus.ACCEPTED);
        }

        try {
            return objectMapper.readValue(parsedResume.getParsedJson(), ResumeParsedResponse.class);
        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to decode structured resume JSON payload: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private void markAsFailed(ParsedResume parsedResume, String message) {
        try {
            parsedResume.setStatus(ParsingStatus.FAILED);
            parsedResume.setErrorMessage(message);
            parsedResume.setUpdatedAt(LocalDateTime.now());
            parsedResumeRepository.save(parsedResume);
        } catch (Exception ex) {
            log.error("Failed to update status to FAILED for resume: {}", parsedResume.getResumeId(), ex);
        }
    }

    private ResumeParsedResponse extractStructuredData(Map<SectionDetector.SectionType, String> sections, String originalFileName) {
        // 1. Personal Info
        String personalText = sections.get(SectionDetector.SectionType.PERSONAL_INFO);
        PersonalInfoResponse personalInfo = PersonalInfoResponse.builder()
                .fullName(ResumeParserUtils.extractName(personalText, originalFileName))
                .email(ResumeParserUtils.extractEmail(personalText))
                .phone(ResumeParserUtils.extractPhone(personalText))
                .location(ResumeParserUtils.extractLocation(personalText))
                .linkedin(ResumeParserUtils.extractLinkedin(personalText))
                .github(ResumeParserUtils.extractGithub(personalText))
                .portfolio(ResumeParserUtils.extractPortfolio(personalText))
                .build();

        // 2. Education
        List<EducationResponse> education = ResumeParserUtils.parseEducation(sections.get(SectionDetector.SectionType.EDUCATION));

        // 3. Skills
        // Combine skills section and summary section for holistic skill detection
        String skillsText = (sections.getOrDefault(SectionDetector.SectionType.SKILLS, "")) + "\n" +
                            (sections.getOrDefault(SectionDetector.SectionType.SUMMARY, ""));
        Map<String, List<String>> parsedSkills = KeywordExtractor.extractSkills(skillsText);
        SkillResponse skills = SkillResponse.builder()
                .programmingLanguages(parsedSkills.getOrDefault("languages", Collections.emptyList()))
                .frameworks(parsedSkills.getOrDefault("frameworks", Collections.emptyList()))
                .libraries(parsedSkills.getOrDefault("libraries", Collections.emptyList()))
                .databases(parsedSkills.getOrDefault("databases", Collections.emptyList()))
                .cloud(parsedSkills.getOrDefault("cloud", Collections.emptyList()))
                .devops(parsedSkills.getOrDefault("devops", Collections.emptyList()))
                .tools(parsedSkills.getOrDefault("tools", Collections.emptyList()))
                .softSkills(parsedSkills.getOrDefault("softSkills", Collections.emptyList()))
                .build();

        // 4. Experience & Internships
        List<ExperienceResponse> experience = ResumeParserUtils.parseExperience(sections.get(SectionDetector.SectionType.EXPERIENCE));
        List<ExperienceResponse> internships = ResumeParserUtils.parseExperience(sections.get(SectionDetector.SectionType.INTERNSHIPS));

        // 5. Projects
        List<ProjectResponse> projects = ResumeParserUtils.parseProjects(sections.get(SectionDetector.SectionType.PROJECTS));

        // 6. Certifications
        List<CertificationResponse> certifications = ResumeParserUtils.parseCertifications(sections.get(SectionDetector.SectionType.CERTIFICATIONS));

        // 7. Achievements & Languages
        List<String> achievements = ResumeParserUtils.extractListItems(sections.get(SectionDetector.SectionType.ACHIEVEMENTS));
        List<String> languages = ResumeParserUtils.extractListItems(sections.get(SectionDetector.SectionType.LANGUAGES));

        return ResumeParsedResponse.builder()
                .personalInfo(personalInfo)
                .education(education)
                .skills(skills)
                .projects(projects)
                .experience(experience)
                .internships(internships)
                .certifications(certifications)
                .achievements(achievements)
                .languages(languages)
                .build();
    }
}
