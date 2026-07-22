package com.resumeiq.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.ai.GeminiService;
import com.resumeiq.ai.PromptBuilder;
import com.resumeiq.dto.response.AIResponse;
import com.resumeiq.dto.response.ResumeParsedResponse;
import com.resumeiq.entity.*;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.AIReviewRepository;
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
public class AIService {

    private final ResumeRepository resumeRepository;
    private final ParsedResumeRepository parsedResumeRepository;
    private final ATSReportRepository atsReportRepository;
    private final AIReviewRepository aiReviewRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AIResponse generateReview(UUID resumeId, String reviewType, String preferences, String userEmail) {
        User user = getUserByEmail(userEmail);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Retrieve Parsed resume data
        ParsedResume parsedResume = parsedResumeRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new CustomException("Please parse the resume under 'Resume Analysis' first before requesting AI review.", HttpStatus.BAD_REQUEST));

        if (parsedResume.getStatus() != ParsingStatus.COMPLETED) {
            throw new CustomException("Resume parsed data is not ready.", HttpStatus.BAD_REQUEST);
        }

        // Optional ATS report
        String atsReportJson = "";
        ATSReport atsReport = atsReportRepository.findByResumeId(resumeId).orElse(null);
        if (atsReport != null) {
            try {
                atsReportJson = objectMapper.writeValueAsString(atsReport);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize ATS report for AI context: {}", e.getMessage());
            }
        }

        // Assemble prompt
        String prompt = "";
        String parsedJson = parsedResume.getParsedJson();

        try {
            ResumeParsedResponse parsedData = objectMapper.readValue(parsedJson, ResumeParsedResponse.class);

            switch (reviewType.toUpperCase()) {
                case "RESUME_REVIEW":
                    prompt = PromptBuilder.buildResumeReviewPrompt(parsedJson, atsReportJson, preferences);
                    break;
                case "PROJECTS_REVIEW":
                    String projectsJson = objectMapper.writeValueAsString(parsedData.getProjects());
                    prompt = PromptBuilder.buildProjectReviewPrompt(projectsJson, preferences);
                    break;
                case "SUMMARY_GEN":
                    String personal = objectMapper.writeValueAsString(parsedData.getPersonalInfo());
                    String experience = objectMapper.writeValueAsString(parsedData.getExperience());
                    String skills = objectMapper.writeValueAsString(parsedData.getSkills());
                    prompt = PromptBuilder.buildSummaryPrompt(personal, experience, skills, preferences);
                    break;
                case "SKILLS_REC":
                    String curSkills = objectMapper.writeValueAsString(parsedData.getSkills());
                    String curExp = objectMapper.writeValueAsString(parsedData.getExperience());
                    prompt = PromptBuilder.buildSkillsPrompt(curSkills, curExp, preferences);
                    break;
                default:
                    throw new CustomException("Invalid AI review request type '" + reviewType + "'.", HttpStatus.BAD_REQUEST);
            }

            long startTime = System.currentTimeMillis();
            
            // Execute Gemini REST call
            String aiResponseMarkdown = geminiService.generateContent(prompt);
            
            // Fallback to Mock generator if API key is not set or configured as 'mock-key'
            if (aiResponseMarkdown == null) {
                aiResponseMarkdown = generateMockReport(parsedData, reviewType);
            }

            long processingTime = System.currentTimeMillis() - startTime;

            // Cache / Log result to database
            AIReview review = AIReview.builder()
                    .resumeId(resumeId)
                    .prompt(prompt)
                    .aiResponse(aiResponseMarkdown)
                    .reviewType(reviewType.toUpperCase())
                    .processingTime(processingTime)
                    .tokenUsage(prompt.length() / 4 + aiResponseMarkdown.length() / 4) // simple token estimate
                    .createdAt(LocalDateTime.now())
                    .build();

            AIReview savedReview = aiReviewRepository.save(review);

            return AIResponse.builder()
                    .id(savedReview.getId())
                    .resumeId(resumeId)
                    .reviewType(savedReview.getReviewType())
                    .responseMarkdown(savedReview.getAiResponse())
                    .processingTime(savedReview.getProcessingTime())
                    .createdAt(savedReview.getCreatedAt())
                    .build();

        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to decode structured resume JSON payload: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public List<AIResponse> getHistory(String userEmail) {
        User user = getUserByEmail(userEmail);
        
        // Fetch all active resumes for user
        List<Resume> userResumes = resumeRepository.findByUserIdAndIsDeletedFalse(user.getId(), Sort.unsorted());
        if (userResumes.isEmpty()) {
            return new ArrayList<>();
        }

        List<UUID> resumeIds = userResumes.stream().map(Resume::getId).collect(Collectors.toList());

        // Find reviews
        List<AIReview> reviews = aiReviewRepository.findByResumeIdIn(resumeIds, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return reviews.stream().map(rev -> AIResponse.builder()
                .id(rev.getId())
                .resumeId(rev.getResumeId())
                .reviewType(rev.getReviewType())
                .responseMarkdown(rev.getAiResponse())
                .processingTime(rev.getProcessingTime())
                .createdAt(rev.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private String generateMockReport(ResumeParsedResponse data, String reviewType) {
        String name = data.getPersonalInfo() != null ? data.getPersonalInfo().getFullName() : "Candidate";
        
        StringBuilder mock = new StringBuilder();
        mock.append("> [!NOTE]\n");
        mock.append("> This report was compiled using local analysis heuristics because the Google Gemini API key has not been configured in application-dev.yml.\n\n");

        if ("RESUME_REVIEW".equalsIgnoreCase(reviewType)) {
            mock.append("# Overall AI Review - Profile Assessment\n\n");
            mock.append("The resume exhibits a strong target alignment for modern software development profiles. Clear structures are defined, but the detail descriptions can be polished to sound more impact-oriented.\n\n");
            
            mock.append("## Resume Strengths\n");
            mock.append("- **Consistent section styling**: Structural pillars (Education, Experience, Skills) are well organized.\n");
            mock.append("- **Technical skills density**: Key tools and coding languages are clearly categorized.\n\n");
            
            mock.append("## Areas to Improve\n");
            mock.append("- **Quantifiable business metrics**: The experience section lists tasks rather than metric results.\n");
            mock.append("- **Headline branding**: A custom branding header is missing from the top contact channels.\n\n");
            
            mock.append("## Headline & Brand\n");
            mock.append("`Software Developer | Specializing in Enterprise Systems & React`\n\n");
            
            mock.append("## Grammar & Writing Quality\n");
            mock.append("The resume relies heavily on passive descriptors like 'Responsible for maintaining' or 'Assisted in coding'. We recommend replacing them with active verbs: **'Architected'**, **'Engineered'**, or **'Streamlined'**.\n\n");
            
            mock.append("## ATS Optimization Tips\n");
            mock.append("Verify that formatting layouts utilize single-column orientations rather than overlapping graphics boxes. Double-check that your phone number and email are clearly parsed in the contact lines.\n\n");
            
            mock.append("## Overall Action Plan\n");
            mock.append("1. **Quantify achievements**: Rewrite experience bullets using the formula: *'Accomplished X, measured by Y, by doing Z'*\n");
            mock.append("2. **Incorporate profile links**: Add github and linkedin URLs to contacts layout.\n");

        } else if ("PROJECTS_REVIEW".equalsIgnoreCase(reviewType)) {
            mock.append("# Projects Review & Optimization Guidelines\n\n");
            if (data.getProjects() != null && !data.getProjects().isEmpty()) {
                for (var proj : data.getProjects()) {
                    mock.append("## Project: ").append(proj.getProjectName()).append("\n\n");
                    mock.append("**Strengths**: Clearly outlines the tech-stack used. The description covers the core application functionality.\n\n");
                    mock.append("**Gaps & Weaknesses**: Lacks performance descriptions. How did you verify scalability? Did you implement CI/CD or security tests?\n\n");
                    mock.append("**Business Impact**: Highlights capability to deliver full applications from inception to delivery.\n\n");
                    mock.append("**Suggested Metrics**: Add response rates, storage optimizations, or automation achievements (e.g. 'Reduced deployments time by 40%').\n\n");
                    mock.append("**Professional Rewrite**:\n");
                    mock.append("- **Engineered** high-availability system features using **").append(String.join(", ", proj.getTechnologies())).append("**.\n");
                    mock.append("- **Optimized** query pipelines to handle concurrent client updates, improving application execution flow.\n\n");
                }
            } else {
                mock.append("No projects found in parsed resume. We recommend adding at least 2 technical projects demonstrating your capabilities.\n");
            }

        } else if ("SUMMARY_GEN".equalsIgnoreCase(reviewType)) {
            mock.append("# Professional Summaries & Objectives Builder\n\n");
            mock.append("Tailored summary options for candidate **").append(name).append("**:\n\n");
            
            mock.append("## 1. Professional Summary\n");
            mock.append("Detail-oriented software engineer with a strong foundation in designing, coding, and maintaining web systems. Skilled in automating deployment pipelines, tuning databases, and building responsive client interfaces. Proven track record of working collaboratively to deliver robust software solutions on schedule.\n\n");
            
            mock.append("## 2. Career Objective\n");
            mock.append("Ambitious developer seeking to leverage hands-on engineering skills to contribute to enterprise-level product development. Eager to solve complex scaling challenges and write clean, maintainable code within a high-growth development team.\n\n");
            
            mock.append("## 3. LinkedIn 'About' Section\n");
            mock.append("I am a software builder passionate about engineering clean code and resolving backend scalability limits. Over my career, I've worked across frameworks and tools to build robust applications from the ground up.\n\n");
            mock.append("I thrive on solving logic puzzles, collaborating with product designers, and shipping features that improve end-user workflows. Let's connect to discuss software engineering, cloud architectures, or open-source solutions!\n");

        } else if ("SKILLS_REC".equalsIgnoreCase(reviewType)) {
            mock.append("# Skill Recommendations & Career Roadmaps\n\n");
            
            mock.append("## 1. Technical Skill Suggestions\n");
            mock.append("- **Frameworks to learn next**: Spring Boot (for backend Java developers), React (for rich frontend user designs).\n");
            mock.append("- **DevOps tools to add**: Docker (for containerization), GitHub Actions (for deployment automation).\n");
            mock.append("- **Cloud services**: AWS (EC2, S3, RDS) to demonstrate hosting knowledge.\n\n");
            
            mock.append("## 2. Soft Skill Suggestions\n");
            mock.append("- **Technical Design**: Practicing architecture diagrams creation.\n");
            mock.append("- **Agile Scrum Practices**: Collaborating via standard sprint planners.\n\n");
            
            mock.append("## 3. Learning Roadmap & Certifications\n");
            mock.append("1. **AWS Certified Cloud Practitioner**: Establish cloud capabilities credentials.\n");
            mock.append("2. **Oracle Certified Professional**: Solidify core coding foundations.\n\n");
            
            mock.append("## 4. Portfolio & Open Source Improvements\n");
            mock.append("- Create a public GitHub repository hosting a **REST API application** that features full database integrations, Swagger documentation, and automated unit test coverages.\n");
        }

        return mock.toString();
    }
}
