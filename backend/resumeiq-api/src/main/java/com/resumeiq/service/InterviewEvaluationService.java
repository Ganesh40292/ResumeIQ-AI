package com.resumeiq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.ai.GeminiService;
import com.resumeiq.dto.request.InterviewResponseRequest;
import com.resumeiq.dto.response.InterviewFeedbackResponse;
import com.resumeiq.dto.response.InterviewSummaryResponse;
import com.resumeiq.entity.InterviewQuestion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewEvaluationService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public InterviewSummaryResponse evaluateSession(UUID sessionId, String role, String difficulty, List<InterviewQuestion> questions, List<InterviewResponseRequest> answers) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert interviewer evaluating a candidate's mock interview performance.\n\n");
        prompt.append("Target Role: ").append(role).append("\n");
        prompt.append("Difficulty: ").append(difficulty).append("\n\n");

        prompt.append("Evaluate these questions and candidate answers pairings:\n");
        
        Map<UUID, InterviewQuestion> questionsMap = new HashMap<>();
        for (InterviewQuestion q : questions) {
            questionsMap.put(q.getId(), q);
        }

        for (InterviewResponseRequest ans : answers) {
            InterviewQuestion q = questionsMap.get(ans.getQuestionId());
            String qText = q != null ? q.getQuestion() : "General Question";
            prompt.append("Question ID: ").append(ans.getQuestionId()).append("\n");
            prompt.append("Question: ").append(qText).append("\n");
            prompt.append("Expected Topics: ").append(q != null ? q.getExpectedAnswer() : "").append("\n");
            prompt.append("Candidate Response: ").append(ans.getUserResponse()).append("\n---\n");
        }

        prompt.append("Calculate ratings out of 100 based on technical accuracy, completeness, grammar, and professionalism.\n");
        prompt.append("Return the evaluation in a strict JSON format structure containing fields:\n");
        prompt.append("- \"overallScore\": An average score rating (0-100)\n");
        prompt.append("- \"overallStrengths\": Markdown bullet summary detailing candidate strengths\n");
        prompt.append("- \"overallWeaknesses\": Markdown bullet summary detailing candidate gaps\n");
        prompt.append("- \"learningRoadmap\": Markdown suggestions detailing study resources (topics, courses, books, certifications)\n");
        prompt.append("- \"evaluations\": A JSON array of evaluations, each containing:\n");
        prompt.append("  - \"questionId\": The UUID of the question\n");
        prompt.append("  - \"score\": rating (0-100)\n");
        prompt.append("  - \"aiFeedback\": detailed feedback explainer\n");
        prompt.append("  - \"improvementSuggestions\": suggestions on how to restructure the response to stand out\n\n");
        prompt.append("Ensure you return ONLY a raw JSON structure. Do not wrap in markdown syntax blocks.\n");

        String aiResponse = geminiService.generateContent(prompt.toString());
        if (aiResponse != null) {
            try {
                // Clean formatting ticks
                String cleanJson = aiResponse.replaceAll("```json", "")
                                             .replaceAll("```", "")
                                             .trim();

                JsonNode root = objectMapper.readTree(cleanJson);
                int overallScore = root.path("overallScore").asInt(75);
                String strengths = root.path("overallStrengths").asText("");
                String weaknesses = root.path("overallWeaknesses").asText("");
                String roadmap = root.path("learningRoadmap").asText("");

                List<InterviewFeedbackResponse> fbList = new ArrayList<>();
                JsonNode evArray = root.path("evaluations");
                if (evArray.isArray()) {
                    for (JsonNode n : evArray) {
                        UUID qId = UUID.fromString(n.path("questionId").asText());
                        InterviewQuestion q = questionsMap.get(qId);
                        fbList.add(InterviewFeedbackResponse.builder()
                                .id(UUID.randomUUID())
                                .questionId(qId)
                                .question(q != null ? q.getQuestion() : "Question")
                                .userResponse(findAnswerText(answers, qId))
                                .aiFeedback(n.path("aiFeedback").asText("Good attempt. Elaborate on details."))
                                .score(n.path("score").asInt(75))
                                .improvementSuggestions(n.path("improvementSuggestions").asText("Include standard code examples or workflow details."))
                                .build());
                    }
                }

                if (!fbList.isEmpty()) {
                    return InterviewSummaryResponse.builder()
                            .sessionId(sessionId)
                            .targetRole(role)
                            .difficulty(difficulty)
                            .overallScore(overallScore)
                            .evaluations(fbList)
                            .strengths(strengths)
                            .weaknesses(weaknesses)
                            .learningRoadmap(roadmap)
                            .completedAt(LocalDateTime.now())
                            .build();
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini generated evaluation JSON: {}. Generating mock evaluation report.", e.getMessage());
            }
        }

        return generateMockEvaluation(sessionId, role, difficulty, questions, answers);
    }

    private String findAnswerText(List<InterviewResponseRequest> answers, UUID questionId) {
        return answers.stream()
                .filter(a -> a.getQuestionId().equals(questionId))
                .map(InterviewResponseRequest::getUserResponse)
                .findFirst()
                .orElse("");
    }

    private InterviewSummaryResponse generateMockEvaluation(UUID sessionId, String role, String difficulty, List<InterviewQuestion> questions, List<InterviewResponseRequest> answers) {
        List<InterviewFeedbackResponse> fbList = new ArrayList<>();
        int sum = 0;

        for (int i = 0; i < questions.size(); i++) {
            InterviewQuestion q = questions.get(i);
            String ansText = findAnswerText(answers, q.getId());
            int score = ansText.length() > 50 ? 85 : ansText.length() > 10 ? 60 : 40;
            sum += score;

            fbList.add(InterviewFeedbackResponse.builder()
                    .id(UUID.randomUUID())
                    .questionId(q.getId())
                    .question(q.getQuestion())
                    .userResponse(ansText)
                    .aiFeedback("Mock Feedback: The candidate attempted the question. Clear structure was shown, though technical definitions can be expanded.")
                    .score(score)
                    .improvementSuggestions("Try using the STAR methodology (Situation, Task, Action, Result) or detailing architectural trade-offs.")
                    .build());
        }

        int overallScore = sum / Math.max(1, questions.size());

        StringBuilder strBuilder = new StringBuilder();
        strBuilder.append("- Structured communication methodology.\n");
        strBuilder.append("- Good understanding of core web application fundamentals.\n");
        strBuilder.append("- Clear references to previous project details.");

        StringBuilder wkBuilder = new StringBuilder();
        wkBuilder.append("- Need to focus on detailed architectural definitions.\n");
        wkBuilder.append("- Technical query optimizations or scale strategies could be highlighted more.");

        StringBuilder roadmap = new StringBuilder();
        roadmap.append("### Recommended Learning Path\n");
        roadmap.append("1. **Topics**: Study database connection pool limits, thread safety in Java, and frontend rendering hooks.\n");
        roadmap.append("2. **Courses**: Review Spring Security setups tutorials, or read AWS Certified Developer roadmap modules.\n");
        roadmap.append("3. **Book**: *Cracking the Coding Interview* by Gayle Laakmann McDowell.");

        return InterviewSummaryResponse.builder()
                .sessionId(sessionId)
                .targetRole(role)
                .difficulty(difficulty)
                .overallScore(overallScore)
                .evaluations(fbList)
                .strengths(strBuilder.toString())
                .weaknesses(wkBuilder.toString())
                .learningRoadmap(roadmap.toString())
                .completedAt(LocalDateTime.now())
                .build();
    }
}
