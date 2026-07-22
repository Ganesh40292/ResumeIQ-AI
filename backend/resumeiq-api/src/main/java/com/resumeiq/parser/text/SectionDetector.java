package com.resumeiq.parser.text;

import java.util.*;
import java.util.regex.Pattern;

public class SectionDetector {

    public enum SectionType {
        PERSONAL_INFO,
        SUMMARY,
        EDUCATION,
        EXPERIENCE,
        INTERNSHIPS,
        SKILLS,
        PROJECTS,
        CERTIFICATIONS,
        ACHIEVEMENTS,
        LANGUAGES
    }

    private static final Map<SectionType, List<Pattern>> SECTION_PATTERNS = new EnumMap<>(SectionType.class);

    static {
        // Compile regexes for section boundary detection
        registerPatterns(SectionType.SUMMARY, 
            "^\\s*(?:summary|professional summary|about me|profile|career objective|objective)\\s*$"
        );
        registerPatterns(SectionType.EDUCATION, 
            "^\\s*(?:education|academic history|academic background|academic profile|studies|qualifications)\\s*$"
        );
        registerPatterns(SectionType.EXPERIENCE, 
            "^\\s*(?:experience|work history|professional experience|employment history|work experience|employment|career history)\\s*$"
        );
        registerPatterns(SectionType.INTERNSHIPS, 
            "^\\s*(?:internships|internship experience|intern experience|internship)\\s*$"
        );
        registerPatterns(SectionType.SKILLS, 
            "^\\s*(?:skills|technical skills|key skills|expertise|technologies|areas of expertise|proficiencies)\\s*$"
        );
        registerPatterns(SectionType.PROJECTS, 
            "^\\s*(?:projects|key projects|personal projects|academic projects|notable projects|developments)\\s*$"
        );
        registerPatterns(SectionType.CERTIFICATIONS, 
            "^\\s*(?:certifications|certifications & licenses|licenses|courses|credentials|accreditations)\\s*$"
        );
        registerPatterns(SectionType.ACHIEVEMENTS, 
            "^\\s*(?:achievements|key achievements|honors|awards|honors & awards|accomplishments)\\s*$"
        );
        registerPatterns(SectionType.LANGUAGES, 
            "^\\s*(?:languages|spoken languages|languages known)\\s*$"
        );
    }

    private static void registerPatterns(SectionType type, String... regexes) {
        List<Pattern> patterns = new ArrayList<>();
        for (String regex : regexes) {
            patterns.add(Pattern.compile(regex, Pattern.CASE_INSENSITIVE));
        }
        SECTION_PATTERNS.put(type, patterns);
    }

    /**
     * Splits clean resume text into segments mapped to SectionType.
     * Everything before the first header goes into PERSONAL_INFO.
     */
    public static Map<SectionType, String> detectSections(String cleanedText) {
        Map<SectionType, String> sectionMap = new EnumMap<>(SectionType.class);
        if (cleanedText == null || cleanedText.isEmpty()) {
            return sectionMap;
        }

        String[] lines = cleanedText.split("\n");
        List<SectionBoundary> boundaries = new ArrayList<>();

        // Scan line-by-line to detect headers
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.length() > 50) {
                // Headers are typically short, skip empty lines or very long lines
                continue;
            }

            SectionType detectedType = matchHeader(line);
            if (detectedType != null) {
                boundaries.add(new SectionBoundary(detectedType, i));
            }
        }

        // Sort boundaries by line index
        boundaries.sort(Comparator.comparingInt(b -> b.lineIndex));

        // If no boundaries detected, treat everything as PERSONAL_INFO
        if (boundaries.isEmpty()) {
            sectionMap.put(SectionType.PERSONAL_INFO, cleanedText);
            return sectionMap;
        }

        // Segment text based on boundaries
        // Part 1: Text before the first boundary is PERSONAL_INFO
        int firstBoundaryIndex = boundaries.get(0).lineIndex;
        if (firstBoundaryIndex > 0) {
            sectionMap.put(SectionType.PERSONAL_INFO, joinLines(lines, 0, firstBoundaryIndex));
        }

        // Part 2: Segment intermediate sections
        for (int k = 0; k < boundaries.size(); k++) {
            SectionBoundary current = boundaries.get(k);
            int start = current.lineIndex + 1;
            int end = (k + 1 < boundaries.size()) ? boundaries.get(k + 1).lineIndex : lines.length;

            String segment = joinLines(lines, start, end).trim();
            // Append if section type occurs multiple times
            if (sectionMap.containsKey(current.type)) {
                sectionMap.put(current.type, sectionMap.get(current.type) + "\n" + segment);
            } else {
                sectionMap.put(current.type, segment);
            }
        }

        return sectionMap;
    }

    private static SectionType matchHeader(String line) {
        for (Map.Entry<SectionType, List<Pattern>> entry : SECTION_PATTERNS.entrySet()) {
            for (Pattern pattern : entry.getValue()) {
                if (pattern.matcher(line).matches()) {
                    return entry.getKey();
                }
            }
        }
        return null;
    }

    private static String joinLines(String[] lines, int start, int end) {
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < end; i++) {
            sb.append(lines[i]).append("\n");
        }
        return sb.toString();
    }

    private static class SectionBoundary {
        SectionType type;
        int lineIndex;

        SectionBoundary(SectionType type, int lineIndex) {
            this.type = type;
            this.lineIndex = lineIndex;
        }
    }
}
