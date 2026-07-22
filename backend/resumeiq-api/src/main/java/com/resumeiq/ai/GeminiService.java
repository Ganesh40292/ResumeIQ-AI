package com.resumeiq.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.ai.config.AIConfiguration;
import com.resumeiq.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private final AIConfiguration aiConfiguration;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Executes generation call to Google Gemini 1.5 Flash API.
     * Returns generated text markdown.
     */
    public String generateContent(String prompt) {
        String apiKey = aiConfiguration.getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey)) {
            log.warn("Gemini API key is missing or configured as mock-key. Falling back to mock generator.");
            return null; // Signals fallback triggers
        }

        String url = String.format("%s/%s:generateContent?key=%s", 
                aiConfiguration.getEndpointUrl(), 
                aiConfiguration.getModel(), 
                apiKey);

        try {
            // Build Payload map
            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> requestBody = Map.of("contents", List.of(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Sending request to Gemini API model: {}", aiConfiguration.getModel());
            String responseStr = restTemplate.postForObject(url, entity, String.class);

            if (responseStr == null) {
                throw new CustomException("Received empty response from Gemini API.", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Parse response node tree
            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode candidates = root.path("candidates");
            if (candidates.isMissingNode() || candidates.isEmpty()) {
                throw new CustomException("Gemini API candidates block is empty.", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            String text = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            if (text == null || text.trim().isEmpty()) {
                throw new CustomException("Failed to extract text from Gemini response payload.", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return text;

        } catch (HttpClientErrorException e) {
            log.error("Gemini API call failed with status: {}, response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new CustomException("Gemini API key is unauthorized or invalid.", HttpStatus.UNAUTHORIZED);
            } else if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new CustomException("Gemini API rate limits exceeded. Please retry in a few moments.", HttpStatus.TOO_MANY_REQUESTS);
            } else {
                throw new CustomException("Gemini API request failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
            }
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API: {}", e.getMessage(), e);
            throw new CustomException("Failed to communicate with Gemini API: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
