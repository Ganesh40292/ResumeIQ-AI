package com.resumeiq.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.ai.GeminiService;
import com.resumeiq.dto.request.JobDescriptionRequest;
import com.resumeiq.dto.request.JobMatchRequest;
import com.resumeiq.dto.response.*;
import com.resumeiq.entity.*;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.JobDescriptionRepository;
import com.resumeiq.repository.JobMatchReportRepository;
import com.resumeiq.repository.ParsedResumeRepository;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobMatchingService {

    private final ResumeRepository resumeRepository;
    private final ParsedResumeRepository parsedResumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final JobMatchReportRepository jobMatchReportRepository;
    private final UserRepository userRepository;
    private final SkillGapService skillGapService;
    private final KeywordMatchingService keywordMatchingService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Transactional
    public JobMatchResponse analyzeMatch(JobMatchRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        
        // Load resume ownership
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(request.getResumeId(), user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Load parsed data
        ParsedResume parsedResume = parsedResumeRepository.findByResumeId(resume.getId())
                .orElseThrow(() -> new CustomException("Resume parsed details not found. Please run Resume Analysis first.", HttpStatus.BAD_REQUEST));

        if (parsedResume.getStatus() != ParsingStatus.COMPLETED) {
            throw new CustomException("Parsed resume data is not ready.", HttpStatus.BAD_REQUEST);
        }

        // Get or save JobDescription
        JobDescription jd;
        if (request.getJobDescriptionId() != null) {
            jd = jobDescriptionRepository.findById(request.getJobDescriptionId())
                    .orElseThrow(() -> new CustomException("Job description profile not found.", HttpStatus.NOT_FOUND));
        } else if (request.getJobDetails() != null) {
            JobDescriptionRequest details = request.getJobDetails();
            if (!StringUtils.hasText(details.getJobTitle()) || !StringUtils.hasText(details.getJobDescription())) {
                throw new CustomException("Job Title and Job Description text are required.", HttpStatus.BAD_REQUEST);
            }
            jd = JobDescription.builder()
                    .userId(user.getId())
                    .jobTitle(details.getJobTitle())
                    .companyName(details.getCompanyName() != null ? details.getCompanyName() : "Target Company")
                    .location(details.getLocation())
                    .employmentType(details.getEmploymentType())
                    .experienceRequired(details.getExperienceRequired() != null ? details.getExperienceRequired() : 0)
                    .jobDescription(details.getJobDescription())
                    .requiredSkills(details.getRequiredSkills())
                    .preferredSkills(details.getPreferredSkills())
                    .createdAt(LocalDateTime.now())
                    .build();
            jd = jobDescriptionRepository.save(jd);
        } else {
            throw new CustomException("Missing job details or jobDescriptionId reference.", HttpStatus.BAD_REQUEST);
        }

        try {
            // Deserialise resume DTO
            ResumeParsedResponse parsedData = objectMapper.readValue(parsedResume.getParsedJson(), ResumeParsedResponse.class);

            // Compute scores
            SkillGapResponse skillGap = skillGapService.calculateGaps(
                    parsedData, jd.getRequiredSkills(), jd.getPreferredSkills(), jd.getJobDescription()
            );

            int experienceScore = calculateExperienceScore(parsedData.getExperience(), parsedData.getInternships(), jd.getExperienceRequired());
            int skillsScore = calculateRequiredSkillsScore(skillGap, jd.getRequiredSkills());
            int keywordScore = calculatePreferredKeywordsScore(skillGap, jd.getPreferredSkills());
            int educationScore = calculateEducationScore(parsedData.getEducation(), jd.getJobDescription());
            int projectScore = calculateProjectScore(parsedData.getProjects(), jd.getJobDescription());

            // Weighted Overall Score
            // Skills: 35%, Experience: 25%, Keyword: 20%, Edu: 10%, Project: 10%
            double overallVal = (0.35 * skillsScore)
                              + (0.25 * experienceScore)
                              + (0.20 * keywordScore)
                              + (0.10 * educationScore)
                              + (0.10 * projectScore);
            int overallMatchScore = (int) Math.round(overallVal);

            // Strengths and Weaknesses
            List<String> strengths = new ArrayList<>();
            List<String> weaknesses = new ArrayList<>();
            generateStrengthsAndWeaknesses(skillsScore, experienceScore, skillGap, strengths, weaknesses);

            // Gemini explanation
            String recommendations = generateRecommendations(parsedData, jd, overallMatchScore, skillGap);

            // Save report
            JobMatchReport report = jobMatchReportRepository.findByResumeIdAndJobDescriptionId(resume.getId(), jd.getId())
                    .orElse(JobMatchReport.builder().resumeId(resume.getId()).jobDescriptionId(jd.getId()).build());

            report.setOverallMatchScore(overallMatchScore);
            report.setSkillsMatchScore(skillsScore);
            report.setExperienceMatchScore(experienceScore);
            report.setEducationMatchScore(educationScore);
            report.setKeywordMatchScore(keywordScore);
            report.setStrengths(objectMapper.writeValueAsString(strengths));
            report.setWeaknesses(objectMapper.writeValueAsString(weaknesses));
            report.setMissingSkills(objectMapper.writeValueAsString(skillGap));
            report.setRecommendations(recommendations);
            report.setCreatedAt(LocalDateTime.now());

            JobMatchReport savedReport = jobMatchReportRepository.save(report);

            return JobMatchResponse.builder()
                    .id(savedReport.getId())
                    .resumeId(resume.getId())
                    .jobDescriptionId(jd.getId())
                    .jobTitle(jd.getJobTitle())
                    .companyName(jd.getCompanyName())
                    .overallMatchScore(overallMatchScore)
                    .skillsMatchScore(skillsScore)
                    .experienceMatchScore(experienceScore)
                    .educationMatchScore(educationScore)
                    .keywordMatchScore(keywordScore)
                    .strengths(strengths)
                    .weaknesses(weaknesses)
                    .skillGap(skillGap)
                    .recommendations(recommendations)
                    .createdAt(savedReport.getCreatedAt())
                    .build();

        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to encode structured resume JSON payload: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(readOnly = true)
    public List<JobMatchResponse> getHistory(String userEmail) {
        User user = getUserByEmail(userEmail);
        
        List<Resume> userResumes = resumeRepository.findByUserIdAndIsDeletedFalse(user.getId(), Sort.unsorted());
        if (userResumes.isEmpty()) {
            return new ArrayList<>();
        }

        List<UUID> resumeIds = userResumes.stream().map(Resume::getId).collect(Collectors.toList());
        List<JobMatchReport> reports = jobMatchReportRepository.findByResumeIdIn(resumeIds, Sort.by(Sort.Direction.DESC, "createdAt"));

        return reports.stream().map(rep -> {
            JobDescription jd = jobDescriptionRepository.findById(rep.getJobDescriptionId()).orElse(null);
            String title = jd != null ? jd.getJobTitle() : "Job Match";
            String company = jd != null ? jd.getCompanyName() : "Company";

            List<String> strList = new ArrayList<>();
            List<String> wkList = new ArrayList<>();
            SkillGapResponse gap = null;

            try {
                strList = objectMapper.readValue(rep.getStrengths(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
                wkList = objectMapper.readValue(rep.getWeaknesses(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
                gap = objectMapper.readValue(rep.getMissingSkills(), SkillGapResponse.class);
            } catch (Exception e) {
                log.warn("Failed to parse stored JSON list attributes for report ID: {}", rep.getId());
            }

            return JobMatchResponse.builder()
                    .id(rep.getId())
                    .resumeId(rep.getResumeId())
                    .jobDescriptionId(rep.getJobDescriptionId())
                    .jobTitle(title)
                    .companyName(company)
                    .overallMatchScore(rep.getOverallMatchScore())
                    .skillsMatchScore(rep.getSkillsMatchScore())
                    .experienceMatchScore(rep.getExperienceMatchScore())
                    .educationMatchScore(rep.getEducationMatchScore())
                    .keywordMatchScore(rep.getKeywordMatchScore())
                    .strengths(strList)
                    .weaknesses(wkList)
                    .skillGap(gap)
                    .recommendations(rep.getRecommendations())
                    .createdAt(rep.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    // Scoring helpers
    private int calculateExperienceScore(List<ExperienceResponse> exp, List<ExperienceResponse> intern, Integer reqYears) {
        if (reqYears == null || reqYears == 0) {
            return 100;
        }

        // Calculate candidate experience (estimate years difference from history timelines)
        int candidateYears = 0;
        List<ExperienceResponse> combined = new ArrayList<>();
        if (exp != null) combined.addAll(exp);
        if (intern != null) combined.addAll(intern);

        for (ExperienceResponse entry : combined) {
            String duration = entry.getDuration();
            if (StringUtils.hasText(duration)) {
                // Find years (e.g. 2018 - 2022)
                var matcher = Pattern.compile("\\b(19|20)\\d{2}\\b").matcher(duration);
                List<Integer> years = new ArrayList<>();
                while (matcher.find()) {
                    years.add(Integer.parseInt(matcher.group(0)));
                }
                if (years.size() == 2) {
                    candidateYears += Math.max(0, years.get(1) - years.get(0));
                } else if (years.size() == 1) {
                    int current = LocalDateTime.now().getYear();
                    candidateYears += Math.max(0, current - years.get(0)); // Assume still active
                }
            }
        }

        if (candidateYears == 0) {
            candidateYears = 1; // Fallback minimum baseline if parsing date details fail
        }

        if (candidateYears >= reqYears) {
            return 100;
        }

        // Deduct 15 pts per missing year
        int missing = reqYears - candidateYears;
        return Math.max(40, 100 - (missing * 15));
    }

    private int calculateRequiredSkillsScore(SkillGapResponse skillGap, String csv) {
        if (csv == null || csv.trim().isEmpty()) {
            return 100; // No requirements specified
        }

        int total = csv.split(",").length;
        int missing = skillGap.getCriticalSkills().size();
        int matched = Math.max(0, total - missing);

        return (int) Math.round(((double) matched / total) * 100);
    }

    private int calculatePreferredKeywordsScore(SkillGapResponse skillGap, String csv) {
        if (csv == null || csv.trim().isEmpty()) {
            return 100;
        }

        int total = csv.split(",").length;
        int missing = skillGap.getImportantSkills().size();
        int matched = Math.max(0, total - missing);

        return (int) Math.round(((double) matched / total) * 100);
    }

    private int calculateEducationScore(List<EducationResponse> eduList, String jdText) {
        if (jdText == null || eduList == null || eduList.isEmpty()) {
            return 100;
        }

        String lowerJd = jdText.toLowerCase();
        boolean requiresMaster = lowerJd.contains("master") || lowerJd.contains("m.s.") || lowerJd.contains("m.tech");
        boolean requiresPhd = lowerJd.contains("ph.d") || lowerJd.contains("phd");

        for (EducationResponse edu : eduList) {
            String degree = edu.getDegree().toLowerCase();
            if (requiresPhd && (degree.contains("phd") || degree.contains("ph.d"))) {
                return 100;
            }
            if (requiresMaster && (degree.contains("master") || degree.contains("m.s.") || degree.contains("m.tech") || degree.contains("phd") || degree.contains("ph.d"))) {
                return 100;
            }
        }

        // If JD mentions Master/Phd but candidate has only bachelor, return 75
        if (requiresPhd || requiresMaster) {
            return 75;
        }

        return 100;
    }

    private int calculateProjectScore(List<ProjectResponse> projs, String jdText) {
        if (jdText == null || projs == null || projs.isEmpty()) {
            return 100;
        }

        // If candidate projects match at least one keyword in the Job Description, return 100
        String lowerJd = jdText.toLowerCase();
        for (ProjectResponse proj : projs) {
            if (proj.getTechnologies() != null) {
                for (String tech : proj.getTechnologies()) {
                    if (lowerJd.contains(tech.toLowerCase())) {
                        return 100;
                    }
                }
            }
        }

        return 75;
    }

    private void generateStrengthsAndWeaknesses(int skills, int exp, SkillGapResponse gaps, List<String> strengths, List<String> weaknesses) {
        if (skills >= 80) {
            strengths.add("Strong alignment with required technical skills.");
        } else {
            weaknesses.add("Missing key technical skills requested in the job description.");
        }

        if (exp >= 80) {
            strengths.add("Candidate meets or exceeds target years of experience.");
        } else {
            weaknesses.add("Years of experience are below target job requirements.");
        }

        if (gaps.getCriticalSkills().isEmpty()) {
            strengths.add("Matches all critical candidate baseline required tags.");
        } else {
            weaknesses.add("Missing required core skills: " + String.join(", ", gaps.getCriticalSkills().subList(0, Math.min(3, gaps.getCriticalSkills().size()))));
        }
    }

    private String generateRecommendations(ResumeParsedResponse data, JobDescription jd, int matchScore, SkillGapResponse gaps) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert technical recruiter matching candidate profiles against job postings. Provide a detailed, professional alignment explanation in Markdown.\n\n");
        
        prompt.append("Target Job Description Title: ").append(jd.getJobTitle()).append("\n");
        prompt.append("Job description:\n").append(jd.getJobDescription()).append("\n\n");
        prompt.append("Candidate parsed details:\n");
        
        try {
            prompt.append("Skills: ").append(objectMapper.writeValueAsString(data.getSkills())).append("\n");
            prompt.append("Experience: ").append(objectMapper.writeValueAsString(data.getExperience())).append("\n");
            prompt.append("Projects: ").append(objectMapper.writeValueAsString(data.getProjects())).append("\n\n");
        } catch (Exception e) {
            prompt.append("Name: ").append(data.getPersonalInfo() != null ? data.getPersonalInfo().getFullName() : "Candidate").append("\n");
        }

        prompt.append("Java Computed match status metrics (Scores are computed rule-based out of 100):\n");
        prompt.append("- Overall match: ").append(matchScore).append("\n");
        prompt.append("- Missing required critical skills: ").append(String.join(", ", gaps.getCriticalSkills())).append("\n");
        prompt.append("- Missing preferred skills: ").append(String.join(", ", gaps.getImportantSkills())).append("\n\n");

        prompt.append("Generate the report in Markdown. Outline:\n");
        prompt.append("1. **Compatibility Summary**: A professional explanation of how the candidate's profile matches this JD.\n");
        prompt.append("2. **Bridging the Skill Gaps**: Clear learning roadmap recommendations to study missing required or preferred technologies.\n");
        prompt.append("3. **Job Alignment Rewrite Suggestions**: Suggest how the candidate can optimize their Projects description or Work Experience responsibilities text to mirror keywords and terminology used in the Job Description.\n");
        prompt.append("Do NOT calculate any scores. Do NOT include numbers like 'Your score is X' in the recommendations.\n");

        // Request Gemini service content
        String aiResponse = geminiService.generateContent(prompt.toString());
        if (aiResponse == null) {
            aiResponse = generateMockRecommendations(data, jd, matchScore, gaps);
        }

        return aiResponse;
    }

    private String generateMockRecommendations(ResumeParsedResponse data, JobDescription jd, int matchScore, SkillGapResponse gaps) {
        StringBuilder mock = new StringBuilder();
        mock.append("> [!NOTE]\n");
        mock.append("> Gemini AI key is not set. Showing rule-based mock recommendations roadmap.\n\n");
        
        mock.append("# Compatibility Summary\n");
        mock.append("The candidate exhibits a **").append(matchScore).append("%** profile compatibility for the **").append(jd.getJobTitle()).append("** role at **").append(jd.getCompanyName()).append("**.\n");
        
        if (gaps.getCriticalSkills().isEmpty()) {
            mock.append("You possess all specified required skills for this job. However, keyword matches in project bullets can be enhanced.\n\n");
        } else {
            mock.append("The primary gap preventing a stronger match is the absence of required skills: **").append(String.join(", ", gaps.getCriticalSkills())).append("**.\n\n");
        }

        mock.append("# Bridging the Skill Gaps\n");
        if (!gaps.getCriticalSkills().isEmpty()) {
            mock.append("## Learning path for required skills:\n");
            for (String c : gaps.getCriticalSkills()) {
                mock.append("- **").append(c).append("**: Study standard integrations, review online documentation tutorials, and build a sandbox repository using the tool.\n");
            }
        }
        if (!gaps.getImportantSkills().isEmpty()) {
            mock.append("## Recommended preferred additions:\n");
            for (String imp : gaps.getImportantSkills()) {
                mock.append("- **").append(imp).append("**: Incorporate this keyword in your skills collection card by building minor projects showcasing its utilization.\n");
            }
        }

        mock.append("\n# Job Alignment Rewrite Suggestions\n");
        if (data.getProjects() != null && !data.getProjects().isEmpty()) {
            mock.append("To align your projects with the **").append(jd.getJobTitle()).append("** description:\n");
            mock.append("- Add **'REST API'** or similar architectural concepts mentioned in the job description to your project descriptions.\n");
            mock.append("- Highlight scaling details, thread pools optimization, or container tools like Docker if mentioned in the JD text.\n");
        }

        return mock.toString();
    }
}
