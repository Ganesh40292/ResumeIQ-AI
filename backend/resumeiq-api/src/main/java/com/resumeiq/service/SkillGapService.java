package com.resumeiq.service;

import com.resumeiq.dto.response.ResumeParsedResponse;
import com.resumeiq.dto.response.SkillGapResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillGapService {

    private final KeywordMatchingService keywordMatchingService;

    // Standard list of other common technical terms to check as optional/nice-to-have gaps
    private static final List<String> OPTIONAL_TAXONOMY = List.of(
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Jenkins", "Git", "Jira", "CI/CD", 
        "Agile", "Scrum", "REST API", "Microservices", "GraphQL", "TypeScript", "Python"
    );

    public SkillGapResponse calculateGaps(ResumeParsedResponse resumeData, String requiredSkills, String preferredSkills, String jdText) {
        Set<String> candidateSkills = collectCandidateSkills(resumeData);

        // 1. Critical Missing (Required Skills not in profile)
        List<String> requiredList = parseCommaList(requiredSkills);
        List<String> critical = requiredList.stream()
                .filter(req -> !hasSkill(candidateSkills, req))
                .collect(Collectors.toList());

        // 2. Important Missing (Preferred Skills not in profile)
        List<String> preferredList = parseCommaList(preferredSkills);
        List<String> important = preferredList.stream()
                .filter(pref -> !hasSkill(candidateSkills, pref))
                .collect(Collectors.toList());

        // 3. Optional Missing (Taxonomy terms in JD text, but missing in candidate profile, not in required/preferred)
        List<String> optional = new ArrayList<>();
        if (jdText != null) {
            for (String tax : OPTIONAL_TAXONOMY) {
                // If it is in JD text and missing in candidate, and not already listed as required/preferred
                if (keywordMatchingService.isKeywordPresent(jdText, tax) 
                        && !hasSkill(candidateSkills, tax)
                        && !containsIgnoreCase(requiredList, tax) 
                        && !containsIgnoreCase(preferredList, tax)) {
                    optional.add(tax);
                }
            }
        }

        return SkillGapResponse.builder()
                .criticalSkills(critical)
                .importantSkills(important)
                .optionalSkills(optional)
                .build();
    }

    private Set<String> collectCandidateSkills(ResumeParsedResponse data) {
        Set<String> skills = new HashSet<>();
        if (data == null || data.getSkills() == null) {
            return skills;
        }

        var s = data.getSkills();
        addToList(s.getProgrammingLanguages(), skills);
        addToList(s.getFrameworks(), skills);
        addToList(s.getLibraries(), skills);
        addToList(s.getDatabases(), skills);
        addToList(s.getCloud(), skills);
        addToList(s.getDevops(), skills);
        addToList(s.getTools(), skills);
        addToList(s.getSoftSkills(), skills);

        return skills;
    }

    private void addToList(List<String> source, Set<String> target) {
        if (source != null) {
            for (String str : source) {
                target.add(str.trim().toLowerCase());
            }
        }
    }

    private boolean hasSkill(Set<String> lookupSet, String skill) {
        return lookupSet.contains(skill.trim().toLowerCase());
    }

    private List<String> parseCommaList(String csv) {
        if (csv == null || csv.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private boolean containsIgnoreCase(List<String> list, String term) {
        return list.stream().anyMatch(item -> item.equalsIgnoreCase(term));
    }
}
