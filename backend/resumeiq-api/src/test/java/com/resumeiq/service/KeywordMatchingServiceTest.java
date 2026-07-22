package com.resumeiq.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class KeywordMatchingServiceTest {

    private final KeywordMatchingService service = new KeywordMatchingService();

    @Test
    void testIsKeywordPresent() {
        String text = "We are seeking a senior Java developer with C++ experience.";
        assertTrue(service.isKeywordPresent(text, "Java"));
        assertTrue(service.isKeywordPresent(text, "java"));
        assertTrue(service.isKeywordPresent(text, "C++"));
        assertFalse(service.isKeywordPresent(text, "Python"));
    }

    @Test
    void testFindMatches() {
        String text = "Experienced Frontend Engineer skilled in React, HTML, CSS and TypeScript.";
        List<String> targets = List.of("React", "Java", "TypeScript", "Docker");
        List<String> matched = service.findMatches(text, targets);

        assertEquals(2, matched.size());
        assertTrue(matched.contains("React"));
        assertTrue(matched.contains("TypeScript"));
    }
}
