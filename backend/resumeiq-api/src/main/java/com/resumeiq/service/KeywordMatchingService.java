package com.resumeiq.service;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class KeywordMatchingService {

    /**
     * Checks if a skill term occurs in the given text block (case-insensitive, safe word matching).
     */
    public boolean isKeywordPresent(String textBlock, String keyword) {
        if (textBlock == null || keyword == null || keyword.trim().isEmpty()) {
            return false;
        }

        String blockLower = textBlock.toLowerCase();
        String kwLower = keyword.trim().toLowerCase();

        // Handle special characters like C++ or C# safely
        String regex;
        if (kwLower.contains("+") || kwLower.contains("#")) {
            regex = "(?:^|\\s|[.,/])" + Pattern.quote(kwLower) + "(?:$|\\s|[.,/])";
        } else {
            regex = "\\b" + Pattern.quote(kwLower) + "\\b";
        }

        try {
            return Pattern.compile(regex).matcher(blockLower).find();
        } catch (Exception e) {
            // Fallback to simple contains if regex compiles incorrectly
            return blockLower.contains(kwLower);
        }
    }

    /**
     * Scans Job Description text block for lists of target terms.
     * Returns matching elements.
     */
    public List<String> findMatches(String textBlock, List<String> targetKeywords) {
        List<String> matched = new ArrayList<>();
        if (textBlock == null || targetKeywords == null) {
            return matched;
        }

        for (String kw : targetKeywords) {
            if (isKeywordPresent(textBlock, kw)) {
                matched.add(kw.trim());
            }
        }
        return matched;
    }
}
