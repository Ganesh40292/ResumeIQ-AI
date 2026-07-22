package com.resumeiq.parser.text;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DateExtractor {

    private static final Pattern DATE_RANGE_PATTERN = Pattern.compile(
        "\\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+)?(\\d{4})\\s*[-–—to\\s]+\\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+)?(\\d{4})|present|current|ongoing|now)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SINGLE_YEAR_PATTERN = Pattern.compile("\\b(19|20)\\d{2}\\b");

    /**
     * Extracts date range descriptions from text (e.g. "2018 - 2022" or "Jan 2021 - Present")
     */
    public static String extractDateRange(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        Matcher rangeMatcher = DATE_RANGE_PATTERN.matcher(text);
        if (rangeMatcher.find()) {
            return rangeMatcher.group(0).trim();
        }

        // Fallback: search for single years or consecutive years
        Matcher yearMatcher = SINGLE_YEAR_PATTERN.matcher(text);
        List<String> years = new ArrayList<>();
        while (yearMatcher.find() && years.size() < 2) {
            years.add(yearMatcher.group(0));
        }

        if (years.size() == 2) {
            return years.get(0) + " - " + years.get(1);
        } else if (years.size() == 1) {
            return years.get(0);
        }

        return "";
    }

    /**
     * Extracts individual years from text (e.g., college degrees "2018 - 2022")
     * Returns a pair of [startYear, endYear] if found.
     */
    public static String[] extractStartEndYears(String text) {
        String range = extractDateRange(text);
        if (range.isEmpty()) {
            // Find all single years
            Matcher yearMatcher = SINGLE_YEAR_PATTERN.matcher(text);
            List<String> years = new ArrayList<>();
            while (yearMatcher.find()) {
                years.add(yearMatcher.group(0));
            }
            if (years.size() >= 2) {
                return new String[]{years.get(0), years.get(1)};
            } else if (years.size() == 1) {
                return new String[]{years.get(0), "Present"};
            }
            return new String[]{"", ""};
        }

        Matcher yearMatcher = Pattern.compile("\\b(\\d{4})\\b").matcher(range);
        List<String> years = new ArrayList<>();
        while (yearMatcher.find()) {
            years.add(yearMatcher.group(1));
        }

        String start = years.size() > 0 ? years.get(0) : "";
        String end = "Present";
        if (years.size() > 1) {
            end = years.get(1);
        } else if (range.toLowerCase().contains("present") || range.toLowerCase().contains("current")) {
            end = "Present";
        } else if (years.size() == 1) {
            end = years.get(0); // If only one year detected and no present keyword, treat as both start/end (like graduation year)
        }

        return new String[]{start, end};
    }
}
