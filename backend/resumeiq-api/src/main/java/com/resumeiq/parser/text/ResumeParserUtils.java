package com.resumeiq.parser.text;

import com.resumeiq.dto.response.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ResumeParserUtils {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}"
    );

    // Matches standard phone numbers, optional country code, spaces/dashes, parentheses
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "\\+?\\b\\d{1,4}[-.\\s]?\\(?\\d{1,3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b"
    );

    private static final Pattern LINKEDIN_PATTERN = Pattern.compile(
        "\\b(?:https?://)?(?:www\\.)?linkedin\\.com/in/[a-zA-Z0-9_-]+\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern GITHUB_PATTERN = Pattern.compile(
        "\\b(?:https?://)?(?:www\\.)?github\\.com/[a-zA-Z0-9_-]+\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern WEBSITE_PATTERN = Pattern.compile(
        "\\b(?:https?://)?(?:www\\.)?[a-zA-Z0-9_-]+\\.(?:com|org|net|io|me|dev|co|in)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern CGPA_PATTERN = Pattern.compile(
        "\\b([0-9]\\.[0-9]{1,2})\\s*(?:/\\s*10)?\\b"
    );

    private static final Pattern PERCENTAGE_PATTERN = Pattern.compile(
        "\\b(\\d{2}(?:\\.\\d{1,2})?)\\s*%\\b"
    );

    // Precompiled list of common university/college keywords to extract school names
    private static final List<String> SCHOOL_KEYWORDS = List.of(
        "university", "college", "institute", "school", "academy", "polytechnic", "iit", "nit", "bits"
    );

    // Common degrees
    private static final List<String> DEGREES = List.of(
        "B.Tech", "B.Tech.", "B.E.", "B.E", "B.S.", "B.S", "B.Sc", "B.Sc.", "B.A.", "B.A", "B.Com",
        "M.Tech", "M.Tech.", "M.E.", "M.S.", "M.S", "M.Sc", "Ph.D", "PhD", "MBA", "BBA", "MCA", "BCA",
        "Bachelor of Technology", "Bachelor of Engineering", "Bachelor of Science", "Bachelor of Arts",
        "Master of Technology", "Master of Engineering", "Master of Science", "Master of Business"
    );

    public static String extractEmail(String text) {
        if (text == null) return "";
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(0).trim();
        }
        return "";
    }

    public static String extractPhone(String text) {
        if (text == null) return "";
        Matcher matcher = PHONE_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(0).trim();
        }
        return "";
    }

    public static String extractLinkedin(String text) {
        if (text == null) return "";
        Matcher matcher = LINKEDIN_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(0).trim();
        }
        return "";
    }

    public static String extractGithub(String text) {
        if (text == null) return "";
        Matcher matcher = GITHUB_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(0).trim();
        }
        return "";
    }

    public static String extractPortfolio(String text) {
        if (text == null) return "";
        Matcher matcher = WEBSITE_PATTERN.matcher(text);
        while (matcher.find()) {
            String match = matcher.group(0).trim();
            // Filter out linkedin and github links
            if (!match.toLowerCase().contains("linkedin.com") && !match.toLowerCase().contains("github.com")) {
                return match;
            }
        }
        return "";
    }

    public static String extractName(String personalInfoText, String fallbackFileName) {
        if (personalInfoText == null || personalInfoText.isEmpty()) {
            return cleanFileNameToName(fallbackFileName);
        }

        String[] lines = personalInfoText.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // Skip lines containing contact info or links
            if (EMAIL_PATTERN.matcher(trimmed).find() || 
                PHONE_PATTERN.matcher(trimmed).find() || 
                LINKEDIN_PATTERN.matcher(trimmed).find() || 
                GITHUB_PATTERN.matcher(trimmed).find()) {
                continue;
            }

            // Name is usually the first clean capitalized line (e.g. "John Doe")
            // Take lines with 2 to 4 words
            String[] words = trimmed.split("\\s+");
            if (words.length >= 2 && words.length <= 4) {
                boolean allCapitalized = true;
                for (String w : words) {
                    if (w.isEmpty()) continue;
                    char firstChar = w.charAt(0);
                    if (!Character.isUpperCase(firstChar) && Character.isLetter(firstChar)) {
                        allCapitalized = false;
                        break;
                    }
                }
                if (allCapitalized) {
                    return trimmed;
                }
            }
        }

        return cleanFileNameToName(fallbackFileName);
    }

    private static String cleanFileNameToName(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "Resume Candidate";
        }
        // Remove extension
        String name = filename;
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx > 0) {
            name = filename.substring(0, dotIdx);
        }
        // Replace dashes and underscores with space
        name = name.replace('-', ' ').replace('_', ' ');
        // Capitalize words
        String[] words = name.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.isEmpty()) continue;
            sb.append(Character.toUpperCase(w.charAt(0)));
            if (w.length() > 1) {
                sb.append(w.substring(1).toLowerCase());
            }
            sb.append(" ");
        }
        return sb.toString().trim();
    }

    public static String extractLocation(String text) {
        if (text == null || text.isEmpty()) return "";
        // Look for common patterns like "City, State", "City, Country"
        Pattern locationPattern = Pattern.compile(
            "\\b([A-Z][a-zA-Z\\s]+,\\s*[A-Z]{2}(?:\\s+\\d{5})?|[A-Z][a-zA-Z\\s]+,\\s*[A-Z][a-zA-Z\\s]+)\\b"
        );
        Matcher matcher = locationPattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(0).trim();
        }
        return "";
    }

    /**
     * Parses the EDUCATION section into list of Education DTOs.
     */
    public static List<EducationResponse> parseEducation(String educationText) {
        List<EducationResponse> list = new ArrayList<>();
        if (educationText == null || educationText.isEmpty()) {
            return list;
        }

        // Split by blocks (empty lines indicate sections/schools)
        String[] blocks = educationText.split("\n\n");
        for (String block : blocks) {
            String trimmedBlock = block.trim();
            if (trimmedBlock.isEmpty()) continue;

            String college = "";
            String degree = "";
            String branch = "";
            String cgpa = "";
            String percentage = "";

            String[] lines = trimmedBlock.split("\n");
            
            // 1. Detect School/College Name
            for (String line : lines) {
                String lowerLine = line.toLowerCase();
                for (String kw : SCHOOL_KEYWORDS) {
                    if (lowerLine.contains(kw)) {
                        college = line.trim();
                        break;
                    }
                }
                if (!college.isEmpty()) break;
            }
            // Fallback: use first line if no keywords matched
            if (college.isEmpty() && lines.length > 0) {
                college = lines[0].trim();
            }

            // 2. Detect Degree & Branch
            for (String line : lines) {
                for (String d : DEGREES) {
                    if (line.toLowerCase().contains(d.toLowerCase())) {
                        degree = d;
                        // Extract remaining text as branch
                        String lower = line.toLowerCase();
                        int idx = lower.indexOf(d.toLowerCase());
                        if (idx >= 0) {
                            String branchPart = line.substring(idx + d.length()).replace("in", "").replace("-", "").trim();
                            if (branchPart.startsWith(",") || branchPart.startsWith("-")) {
                                branchPart = branchPart.substring(1).trim();
                            }
                            if (!branchPart.isEmpty()) {
                                branch = branchPart;
                            }
                        }
                        break;
                    }
                }
                if (!degree.isEmpty()) break;
            }

            // 3. Extract Years
            String[] years = DateExtractor.extractStartEndYears(trimmedBlock);

            // 4. Extract GPA or Percentage
            Matcher gpaMatcher = CGPA_PATTERN.matcher(trimmedBlock);
            if (gpaMatcher.find()) {
                cgpa = gpaMatcher.group(1) + "/10";
            }
            Matcher pctMatcher = PERCENTAGE_PATTERN.matcher(trimmedBlock);
            if (pctMatcher.find()) {
                percentage = pctMatcher.group(1) + "%";
            }

            list.add(EducationResponse.builder()
                .college(college)
                .degree(degree.isEmpty() ? "Degree" : degree)
                .branch(branch.isEmpty() ? "General" : branch)
                .cgpa(cgpa)
                .percentage(percentage)
                .startYear(years[0])
                .endYear(years[1])
                .build());
        }

        return list;
    }

    /**
     * Parses EXPERIENCE or INTERNSHIPS sections into list of Experience DTOs.
     */
    public static List<ExperienceResponse> parseExperience(String experienceText) {
        List<ExperienceResponse> list = new ArrayList<>();
        if (experienceText == null || experienceText.isEmpty()) {
            return list;
        }

        // Split by blocks
        String[] blocks = experienceText.split("\n\n");
        for (String block : blocks) {
            String trimmedBlock = block.trim();
            if (trimmedBlock.isEmpty()) continue;

            String company = "";
            String role = "";
            List<String> responsibilities = new ArrayList<>();

            String[] lines = trimmedBlock.split("\n");
            
            // First line typically has Company name / Role / Dates
            if (lines.length > 0) {
                String firstLine = lines[0].trim();
                // Split by common delimiters
                String[] parts = firstLine.split("[|,-]");
                if (parts.length >= 2) {
                    company = parts[0].trim();
                    role = parts[1].trim();
                } else {
                    company = firstLine;
                }
            }

            if (lines.length > 1 && role.isEmpty()) {
                role = lines[1].trim();
            }

            // Extract bullet points as responsibilities
            for (String line : lines) {
                String trimmedLine = line.trim();
                if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-") || trimmedLine.startsWith("*") || trimmedLine.startsWith("o ")) {
                    // Clean bullet character
                    String cleanedLine = trimmedLine.replaceAll("^[•\\-*o]\\s*", "").trim();
                    if (!cleanedLine.isEmpty()) {
                        responsibilities.add(cleanedLine);
                    }
                }
            }

            // If no bullets found, treat subsequent lines as responsibilities
            if (responsibilities.isEmpty() && lines.length > 2) {
                for (int i = 2; i < lines.length; i++) {
                    String clean = lines[i].trim();
                    if (!clean.isEmpty()) {
                        responsibilities.add(clean);
                    }
                }
            }

            String duration = DateExtractor.extractDateRange(trimmedBlock);

            list.add(ExperienceResponse.builder()
                .company(company.isEmpty() ? "Company" : company)
                .role(role.isEmpty() ? "Developer" : role)
                .duration(duration.isEmpty() ? "Timeline" : duration)
                .responsibilities(responsibilities)
                .build());
        }

        return list;
    }

    /**
     * Parses the PROJECTS section into list of Project DTOs.
     */
    public static List<ProjectResponse> parseProjects(String projectsText) {
        List<ProjectResponse> list = new ArrayList<>();
        if (projectsText == null || projectsText.isEmpty()) {
            return list;
        }

        String[] blocks = projectsText.split("\n\n");
        for (String block : blocks) {
            String trimmedBlock = block.trim();
            if (trimmedBlock.isEmpty()) continue;

            String name = "";
            StringBuilder descBuilder = new StringBuilder();
            String gitLink = extractGithub(trimmedBlock);

            String[] lines = trimmedBlock.split("\n");
            if (lines.length > 0) {
                name = lines[0].replaceAll("[|,-].*$", "").trim(); // Take first line before any dates or links as name
            }

            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                // Skip lines containing github links
                if (line.contains("github.com")) continue;

                // Strip bullet point characters if they exist in description lines
                String cleanedLine = line.replaceAll("^[•\\-*o]\\s*", "").trim();
                descBuilder.append(cleanedLine).append(" ");
            }

            String duration = DateExtractor.extractDateRange(trimmedBlock);

            // Extract technologies used in project
            Map<String, List<String>> matchedSkills = KeywordExtractor.extractSkills(trimmedBlock);
            List<String> techList = new ArrayList<>();
            for (List<String> skills : matchedSkills.values()) {
                techList.addAll(skills);
            }

            list.add(ProjectResponse.builder()
                .projectName(name.isEmpty() ? "Project Title" : name)
                .description(descBuilder.toString().trim())
                .technologies(techList)
                .duration(duration.isEmpty() ? "Timeline" : duration)
                .githubLink(gitLink)
                .build());
        }

        return list;
    }

    /**
     * Parses the CERTIFICATIONS section into list of Certification DTOs.
     */
    public static List<CertificationResponse> parseCertifications(String certText) {
        List<CertificationResponse> list = new ArrayList<>();
        if (certText == null || certText.isEmpty()) {
            return list;
        }

        String[] lines = certText.split("\n");
        for (String line : lines) {
            String cleanLine = line.trim().replaceAll("^[•\\-*o]\\s*", "").trim();
            if (cleanLine.isEmpty()) continue;

            String name = "";
            String org = "";
            String date = DateExtractor.extractDateRange(cleanLine);

            // Split name and organization
            String lineWithoutDate = cleanLine.replace(date, "").replace("()", "").replace("[]", "").trim();
            String[] parts = lineWithoutDate.split("(?:,|\\bby\\b|\\bfrom\\b|\\-|\\|)");
            if (parts.length >= 2) {
                name = parts[0].trim();
                org = parts[1].trim();
            } else {
                name = lineWithoutDate;
                org = "Authorized Issuer";
            }

            list.add(CertificationResponse.builder()
                .certificationName(name.isEmpty() ? "Certification" : name)
                .organization(org.isEmpty() ? "Organization" : org)
                .date(date.isEmpty() ? "Issued Date" : date)
                .build());
        }

        return list;
    }

    /**
     * Extracts items from bullet points or lists in sections (Achievements, Languages).
     */
    public static List<String> extractListItems(String sectionText) {
        List<String> items = new ArrayList<>();
        if (sectionText == null || sectionText.isEmpty()) {
            return items;
        }

        String[] lines = sectionText.split("\n");
        for (String line : lines) {
            String clean = line.trim().replaceAll("^[•\\-*o]\\s*", "").trim();
            if (!clean.isEmpty()) {
                items.add(clean);
            }
        }
        return items;
    }
}
