package com.resumeiq.ats;

import com.resumeiq.dto.response.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

public class ATSScoringEngine {

    // Predefined baseline keywords for modern software development profiles
    private static final List<String> BASELINE_KEYWORDS = List.of(
        "Java", "Python", "Docker", "Kubernetes", "React", "AWS", "Git", "CI/CD", "Agile", "SQL"
    );

    public static ATSReportResponse calculateReport(ResumeParsedResponse parsedData, UUID resumeId, String resumeTitle) {
        // Compute individual sections
        int formatting = calculateFormatting(parsedData.getPersonalInfo());
        int education = calculateEducation(parsedData.getEducation());
        int experience = calculateExperience(parsedData.getExperience(), parsedData.getInternships());
        int projects = calculateProjects(parsedData.getProjects());
        int skillsScore = calculateSkills(parsedData.getSkills());
        int readability = calculateReadability(parsedData);
        int structure = calculateStructure(parsedData);

        // Keywords metrics
        KeywordAnalysisResponse keywordsAnalysis = analyzeKeywords(parsedData.getSkills());
        int keywordScore = calculateKeywordScore(keywordsAnalysis);

        // Achievements metrics
        int achievements = calculateAchievements(parsedData.getAchievements());

        // Weighted Overall Score
        // Experience (25%) + Skills (20%) + Keywords (15%) + Edu (10%) + Proj (10%) + Format (10%) + Readability (5%) + Structure (5%)
        double overallVal = (0.25 * experience) 
                          + (0.20 * skillsScore) 
                          + (0.15 * keywordScore) 
                          + (0.10 * education) 
                          + (0.10 * projects) 
                          + (0.10 * formatting) 
                          + (0.05 * readability) 
                          + (0.05 * structure);
        
        int overallScore = (int) Math.round(overallVal);

        // Generate prioritized suggestions list
        List<SuggestionResponse> suggestions = generateSuggestions(
            formatting, education, experience, projects, skillsScore, keywordScore, achievements, readability, parsedData
        );

        return ATSReportResponse.builder()
                .resumeId(resumeId)
                .resumeTitle(resumeTitle)
                .overallScore(overallScore)
                .scoreBreakdown(ScoreBreakdownResponse.builder()
                        .formatting(formatting)
                        .education(education)
                        .experience(experience)
                        .projects(projects)
                        .skills(skillsScore)
                        .keywords(keywordScore)
                        .achievements(achievements)
                        .readability(readability)
                        .structure(structure)
                        .build())
                .keywordAnalysis(keywordsAnalysis)
                .suggestions(suggestions)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private static int calculateFormatting(PersonalInfoResponse info) {
        if (info == null) return 0;
        int score = 0;
        if (hasText(info.getEmail())) score += 20;
        if (hasText(info.getPhone())) score += 20;
        if (hasText(info.getLinkedin())) score += 20;
        if (hasText(info.getGithub())) score += 20;
        if (hasText(info.getLocation()) || hasText(info.getPortfolio())) score += 20;
        return score;
    }

    private static int calculateEducation(List<EducationResponse> eduList) {
        if (eduList == null || eduList.isEmpty()) return 0;
        int score = 50; // base score for having education entries
        
        EducationResponse first = eduList.get(0);
        if (hasText(first.getCollege())) score += 20;
        if (hasText(first.getDegree())) score += 15;
        if (hasText(first.getCgpa()) || hasText(first.getPercentage())) score += 15;
        
        return Math.min(score, 100);
    }

    private static int calculateExperience(List<ExperienceResponse> exp, List<ExperienceResponse> intern) {
        int totalEntries = (exp != null ? exp.size() : 0) + (intern != null ? intern.size() : 0);
        if (totalEntries == 0) return 0;

        int score = 40; // base for experience presence
        
        // Check responsibilities list size and look for numbers/percentages (quantifiable metrics)
        boolean hasBullets = false;
        boolean hasMetrics = false;
        
        List<ExperienceResponse> combined = new ArrayList<>();
        if (exp != null) combined.addAll(exp);
        if (intern != null) combined.addAll(intern);

        Pattern numericPattern = Pattern.compile("\\b(\\d+(?:%|\\+)?)\\b");

        for (ExperienceResponse entry : combined) {
            List<String> bullets = entry.getResponsibilities();
            if (bullets != null && bullets.size() >= 2) {
                hasBullets = true;
                for (String bullet : bullets) {
                    if (numericPattern.matcher(bullet).find() || bullet.toLowerCase().contains("million") || bullet.toLowerCase().contains("billion")) {
                        hasMetrics = true;
                        break;
                    }
                }
            }
        }

        if (hasBullets) score += 30;
        if (hasMetrics) score += 30;

        return Math.min(score, 100);
    }

    private static int calculateProjects(List<ProjectResponse> projs) {
        if (projs == null || projs.isEmpty()) return 0;
        int score = 40; // base score for projects presence
        
        ProjectResponse first = projs.get(0);
        if (first.getTechnologies() != null && !first.getTechnologies().isEmpty()) score += 20;
        if (hasText(first.getDescription()) && first.getDescription().length() > 30) score += 20;
        if (hasText(first.getGithubLink())) score += 20;
        
        return Math.min(score, 100);
    }

    private static int calculateSkills(SkillResponse skills) {
        if (skills == null) return 0;
        int count = 0;
        if (skills.getProgrammingLanguages() != null) count += skills.getProgrammingLanguages().size();
        if (skills.getFrameworks() != null) count += skills.getFrameworks().size();
        if (skills.getDatabases() != null) count += skills.getDatabases().size();
        if (skills.getCloud() != null) count += skills.getCloud().size();
        if (skills.getDevops() != null) count += skills.getDevops().size();

        if (count == 0) return 0;
        if (count < 5) return 45;
        if (count <= 10) return 85;
        return 100;
    }

    private static KeywordAnalysisResponse analyzeKeywords(SkillResponse skills) {
        List<String> detected = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> suggested = new ArrayList<>();

        if (skills == null) {
            return KeywordAnalysisResponse.builder()
                    .detectedKeywords(detected)
                    .missingKeywords(new ArrayList<>(BASELINE_KEYWORDS))
                    .suggestedKeywords(new ArrayList<>(BASELINE_KEYWORDS))
                    .build();
        }

        // Collect all parsed skills into a single set for lookup
        Set<String> parsedSkills = new HashSet<>();
        addSkillsToLookup(skills.getProgrammingLanguages(), parsedSkills);
        addSkillsToLookup(skills.getFrameworks(), parsedSkills);
        addSkillsToLookup(skills.getDatabases(), parsedSkills);
        addSkillsToLookup(skills.getCloud(), parsedSkills);
        addSkillsToLookup(skills.getDevops(), parsedSkills);
        addSkillsToLookup(skills.getTools(), parsedSkills);

        for (String baseline : BASELINE_KEYWORDS) {
            if (containsSkillIgnoreCase(parsedSkills, baseline)) {
                detected.add(baseline);
            } else {
                missing.add(baseline);
                suggested.add(baseline);
            }
        }

        return KeywordAnalysisResponse.builder()
                .detectedKeywords(detected)
                .missingKeywords(missing)
                .suggestedKeywords(suggested)
                .build();
    }

    private static void addSkillsToLookup(List<String> list, Set<String> targetSet) {
        if (list != null) {
            for (String s : list) {
                targetSet.add(s.trim().toLowerCase());
            }
        }
    }

    private static boolean containsSkillIgnoreCase(Set<String> lookupSet, String skill) {
        return lookupSet.contains(skill.toLowerCase());
    }

    private static int calculateKeywordScore(KeywordAnalysisResponse kwAnalysis) {
        int total = BASELINE_KEYWORDS.size();
        int detected = kwAnalysis.getDetectedKeywords().size();
        return (int) Math.round(((double) detected / total) * 100);
    }

    private static int calculateAchievements(List<String> achievements) {
        if (achievements == null || achievements.isEmpty()) return 0;
        int score = 60; // base score for achievements listed

        Pattern numericPattern = Pattern.compile("\\b(\\d+)\\b");
        boolean quantified = false;
        for (String ach : achievements) {
            if (numericPattern.matcher(ach).find() || ach.toLowerCase().contains("percent") || ach.toLowerCase().contains("rank")) {
                quantified = true;
                break;
            }
        }
        if (quantified) score += 40;

        return Math.min(score, 100);
    }

    private static int calculateReadability(ResumeParsedResponse data) {
        // Readability checking word count heuristics
        int wordCount = estimateWordCount(data);
        if (wordCount == 0) return 0;

        int score = 100;
        // Warnings for word count bounds
        if (wordCount < 200 || wordCount > 1000) {
            score -= 25;
        }

        // Average bullet length checks
        boolean averageBulletGood = true;
        int totalBullets = 0;
        int totalBulletWords = 0;

        if (data.getExperience() != null) {
            for (ExperienceResponse exp : data.getExperience()) {
                if (exp.getResponsibilities() != null) {
                    for (String bullet : exp.getResponsibilities()) {
                        totalBullets++;
                        totalBulletWords += bullet.split("\\s+").length;
                    }
                }
            }
        }

        if (totalBullets > 0) {
            int avgWords = totalBulletWords / totalBullets;
            if (avgWords < 8 || avgWords > 30) {
                averageBulletGood = false;
            }
        }

        if (!averageBulletGood) score -= 15;

        return Math.max(score, 0);
    }

    private static int calculateStructure(ResumeParsedResponse data) {
        int score = 60; // base score for standard structural fields existence
        
        // Deduct if core pillars of resume are missing
        if (data.getPersonalInfo() == null) score -= 15;
        if (data.getEducation() == null || data.getEducation().isEmpty()) score -= 15;
        if (data.getExperience() == null || data.getExperience().isEmpty()) score -= 15;
        if (data.getSkills() == null) score -= 15;

        // Standard headings ordering consistency
        boolean standardHeaderOrdering = true;
        // Basic checklist check: profile has linkedin or github links
        if (data.getPersonalInfo() != null) {
            if (!hasText(data.getPersonalInfo().getLinkedin()) && !hasText(data.getPersonalInfo().getGithub())) {
                standardHeaderOrdering = false;
            }
        }

        if (standardHeaderOrdering) score += 40;
        return Math.max(score, 0);
    }

    private static int estimateWordCount(ResumeParsedResponse data) {
        int count = 0;
        if (data.getPersonalInfo() != null) {
            count += getWordCount(data.getPersonalInfo().getFullName());
            count += getWordCount(data.getPersonalInfo().getLocation());
        }
        if (data.getEducation() != null) {
            for (EducationResponse edu : data.getEducation()) {
                count += getWordCount(edu.getCollege());
                count += getWordCount(edu.getDegree());
            }
        }
        if (data.getExperience() != null) {
            for (ExperienceResponse exp : data.getExperience()) {
                count += getWordCount(exp.getCompany());
                count += getWordCount(exp.getRole());
                if (exp.getResponsibilities() != null) {
                    for (String b : exp.getResponsibilities()) {
                        count += getWordCount(b);
                    }
                }
            }
        }
        if (data.getProjects() != null) {
            for (ProjectResponse proj : data.getProjects()) {
                count += getWordCount(proj.getProjectName());
                count += getWordCount(proj.getDescription());
            }
        }
        return count;
    }

    private static int getWordCount(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        return text.trim().split("\\s+").length;
    }

    private static List<SuggestionResponse> generateSuggestions(
        int format, int edu, int exp, int proj, int skills, int kw, int ach, int readability, ResumeParsedResponse data
    ) {
        List<SuggestionResponse> list = new ArrayList<>();

        // High Priority Suggestions
        if (format < 80) {
            if (data.getPersonalInfo() != null && !hasText(data.getPersonalInfo().getLinkedin())) {
                list.add(new SuggestionResponse("HIGH", "Add your LinkedIn profile link to improve contact completeness.", "Formatting", false));
            }
            if (data.getPersonalInfo() != null && !hasText(data.getPersonalInfo().getGithub())) {
                list.add(new SuggestionResponse("HIGH", "Link your GitHub portfolio to showcase project source codes.", "Formatting", false));
            }
        }
        if (exp < 70) {
            list.add(new SuggestionResponse("HIGH", "Quantify accomplishments in your Work Experience bullets (e.g. state percentages or performance gains).", "Experience", false));
        }
        if (skills < 70) {
            list.add(new SuggestionResponse("HIGH", "Include more core technical competencies. Add at least 5 core coding languages or DevOps tools.", "Skills", false));
        }

        // Medium Priority Suggestions
        if (proj < 80) {
            list.add(new SuggestionResponse("MEDIUM", "Add public GitHub repositories links to your key projects descriptions.", "Projects", false));
        }
        if (kw < 70) {
            list.add(new SuggestionResponse("MEDIUM", "Incorporate highly sought-after keywords such as AWS, Docker, Git, or Agile methodologies.", "Keywords", false));
        }
        if (edu < 80) {
            list.add(new SuggestionResponse("MEDIUM", "Add CGPA/percentage values or graduation years for your degree programs.", "Education", false));
        }

        // Low Priority Suggestions
        if (readability < 85) {
            int wordCount = estimateWordCount(data);
            if (wordCount > 1000) {
                list.add(new SuggestionResponse("LOW", "Your resume has a high word density (" + wordCount + " words). Reduce content length under 2 pages.", "Readability", false));
            } else if (wordCount < 300) {
                list.add(new SuggestionResponse("LOW", "Resume content is thin (" + wordCount + " words). Add detailed project descriptions.", "Readability", false));
            }
        }
        if (ach == 0) {
            list.add(new SuggestionResponse("LOW", "Create a dedicated section for honors, hackathons, or notable awards.", "Achievements", false));
        }

        // Auto-complete suggestions that have maximum metrics
        if (format >= 90) {
            list.add(new SuggestionResponse("LOW", "Formatting and contact channels are complete and verified.", "Formatting", true));
        }
        if (skills >= 95) {
            list.add(new SuggestionResponse("LOW", "Technical skills coverage meets best-in-class thresholds.", "Skills", true));
        }

        return list;
    }

    private static boolean hasText(String str) {
        return str != null && !str.trim().isEmpty();
    }
}
