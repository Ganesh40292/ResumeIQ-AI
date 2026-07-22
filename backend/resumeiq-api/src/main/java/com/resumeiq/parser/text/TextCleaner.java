package com.resumeiq.parser.text;

import org.springframework.util.StringUtils;

public class TextCleaner {

    public static String clean(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }

        // Replace non-breaking spaces and tabs with normal spaces
        String cleaned = text.replace("\u00A0", " ")
                             .replace("\t", " ");

        // Normalize quotes and dashes
        cleaned = cleaned.replace("“", "\"")
                         .replace("”", "\"")
                         .replace("‘", "'")
                         .replace("’", "'")
                         .replace("–", "-") // en-dash
                         .replace("—", "-"); // em-dash

        // Remove carriage returns, keep only standard newline (\n)
        cleaned = cleaned.replace("\r\n", "\n")
                         .replace("\r", "\n");

        // Clean control characters (except newline)
        cleaned = cleaned.replaceAll("[\\p{Cntrl}&&[^\\n]]", "");

        // Collapse multiple consecutive spaces to a single space
        cleaned = cleaned.replaceAll(" {2,}", " ");

        // Collapse three or more consecutive newlines to double newlines (to preserve spacing but clean up excessive voids)
        cleaned = cleaned.replaceAll("\n{3,}", "\n\n");

        return cleaned.trim();
    }
}
