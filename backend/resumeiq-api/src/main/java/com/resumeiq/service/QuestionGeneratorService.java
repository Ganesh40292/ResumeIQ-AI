package com.resumeiq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.ai.GeminiService;
import com.resumeiq.dto.response.ResumeParsedResponse;
import com.resumeiq.entity.InterviewQuestion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionGeneratorService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public List<InterviewQuestion> generateQuestions(UUID sessionId, ResumeParsedResponse resumeData, String role, String difficulty, String type) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert technical interviewer. Generate exactly 5 interview questions for a mock interview session.\n\n");
        prompt.append("Target Role: ").append(role).append("\n");
        prompt.append("Interview Category: ").append(type).append("\n");
        prompt.append("Difficulty Threshold: ").append(difficulty).append("\n\n");

        if (resumeData != null) {
            prompt.append("Candidate parsed details:\n");
            try {
                prompt.append("Skills: ").append(objectMapper.writeValueAsString(resumeData.getSkills())).append("\n");
                prompt.append("Projects: ").append(objectMapper.writeValueAsString(resumeData.getProjects())).append("\n");
                prompt.append("Experience: ").append(objectMapper.writeValueAsString(resumeData.getExperience())).append("\n");
            } catch (Exception e) {
                prompt.append("Candidate tech stack contains standard programming languages.\n");
            }
        }

        prompt.append("Generate the questions in a strict JSON array containing exactly 5 JSON objects with fields:\n");
        prompt.append("- \"question\": The question text\n");
        prompt.append("- \"category\": The category of this question (e.g. TECHNICAL, BEHAVIORAL, SYSTEM_DESIGN)\n");
        prompt.append("- \"expectedAnswer\": Key points or expected explanation keywords\n");
        prompt.append("- \"hints\": A helpful hint to provide if the user struggles\n\n");
        prompt.append("Ensure you return ONLY a raw JSON array. Do not wrap in markdown or output other text.\n");

        String aiResponse = geminiService.generateContent(prompt.toString());
        if (aiResponse != null) {
            try {
                // Clean formatting ticks
                String cleanJson = aiResponse.replaceAll("```json", "")
                                             .replaceAll("```", "")
                                             .trim();
                
                JsonNode root = objectMapper.readTree(cleanJson);
                if (root.isArray()) {
                    List<InterviewQuestion> list = new ArrayList<>();
                    for (JsonNode n : root) {
                        list.add(InterviewQuestion.builder()
                                .sessionId(sessionId)
                                .question(n.path("question").asText("Describe a challenge you faced during your projects."))
                                .category(n.path("category").asText(type))
                                .difficulty(difficulty)
                                .expectedAnswer(n.path("expectedAnswer").asText("Clear articulation of roles, problems, and solutions."))
                                .hints(n.path("hints").asText("Mention the technologies used and team size."))
                                .build());
                    }
                    if (!list.isEmpty()) {
                        return list;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini generated questions JSON array: {}. Falling back to default list.", e.getMessage());
            }
        }

        return generateMockQuestions(sessionId, role, difficulty, type);
    }

    private List<InterviewQuestion> generateMockQuestions(UUID sessionId, String role, String difficulty, String type) {
        List<InterviewQuestion> list = new ArrayList<>();
        
        list.add(InterviewQuestion.builder()
                .sessionId(sessionId)
                .question("Explain the lifecycle and state management principles used in your target application stack (" + role + ").")
                .category("TECHNICAL")
                .difficulty(difficulty)
                .expectedAnswer("Explain components rendering, mounting states, and local/global state stores.")
                .hints("Mention tools like React Context, Redux, or Spring bean scopes.")
                .build());

        list.add(InterviewQuestion.builder()
                .sessionId(sessionId)
                .question("Can you describe a complex project you developed? What were the scaling challenges and how did you resolve them?")
                .category("PROJECT_DISCUSSION")
                .difficulty(difficulty)
                .expectedAnswer("Concrete description of database bottlenecks, caching configurations, or latency tuning.")
                .hints("Detail the database query indices or container tools used.")
                .build());

        list.add(InterviewQuestion.builder()
                .sessionId(sessionId)
                .question("How do you ensure application security and secure REST APIs in your codebase?")
                .category("TECHNICAL")
                .difficulty(difficulty)
                .expectedAnswer("Mention tokens, authentication headers, database validations, or CORS parameters.")
                .hints("Reference standards like OAuth2, Spring Security, or JWT.")
                .build());

        list.add(InterviewQuestion.builder()
                .sessionId(sessionId)
                .question("Describe a situation where you had a conflict with a teammate. How did you work together to resolve it?")
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .expectedAnswer("STAR method structure focusing on collaborative problem resolution.")
                .hints("Emphasize listening skills and finding consensus.")
                .build());

        list.add(InterviewQuestion.builder()
                .sessionId(sessionId)
                .question("Where do you see yourself in the next 3 to 5 years, and how does this role align with your career roadmap?")
                .category("HR")
                .difficulty(difficulty)
                .expectedAnswer("Clear career alignment showing enthusiasm for learning new technical frameworks.")
                .hints("Align your skills with leadership or senior developer tracks.")
                .build());

        return list;
    }
}
