package com.resumeiq.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeiq.dto.request.InterviewEvaluationRequest;
import com.resumeiq.dto.request.InterviewResponseRequest;
import com.resumeiq.dto.request.InterviewSessionRequest;
import com.resumeiq.dto.response.*;
import com.resumeiq.entity.*;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ParsedResumeRepository parsedResumeRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final InterviewResponseRepository interviewResponseRepository;
    
    private final QuestionGeneratorService questionGeneratorService;
    private final InterviewEvaluationService interviewEvaluationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public InterviewSessionResponse startSession(InterviewSessionRequest request, String email) {
        User user = getUserByEmail(email);

        ResumeParsedResponse parsedData = null;
        if (request.getResumeId() != null) {
            Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(request.getResumeId(), user.getId())
                    .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

            Optional<ParsedResume> parsedOpt = parsedResumeRepository.findByResumeId(resume.getId());
            if (parsedOpt.isPresent() && parsedOpt.get().getStatus() == ParsingStatus.COMPLETED) {
                try {
                    parsedData = objectMapper.readValue(parsedOpt.get().getParsedJson(), ResumeParsedResponse.class);
                } catch (Exception e) {
                    log.warn("Failed to parse resume JSON data: {}", e.getMessage());
                }
            }
        }

        InterviewSession session = InterviewSession.builder()
                .userId(user.getId())
                .resumeId(request.getResumeId())
                .jobDescriptionId(request.getJobDescriptionId())
                .interviewType(request.getInterviewType())
                .targetRole(request.getTargetRole())
                .difficulty(request.getDifficulty())
                .status("STARTED")
                .startedAt(LocalDateTime.now())
                .build();

        InterviewSession savedSession = interviewSessionRepository.save(session);

        // Generate questions
        List<InterviewQuestion> generatedQuestions = questionGeneratorService.generateQuestions(
                savedSession.getId(), parsedData, request.getTargetRole(), request.getDifficulty(), request.getInterviewType()
        );

        List<InterviewQuestion> savedQuestions = interviewQuestionRepository.saveAll(generatedQuestions);

        List<InterviewQuestionResponse> questionResponses = savedQuestions.stream()
                .map(this::mapQuestionToResponse)
                .collect(Collectors.toList());

        return mapSessionToResponse(savedSession, questionResponses);
    }

    @Transactional
    public InterviewSummaryResponse evaluateSession(InterviewEvaluationRequest request, String email) {
        User user = getUserByEmail(email);

        InterviewSession session = interviewSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new CustomException("Interview session not found.", HttpStatus.NOT_FOUND));

        if (!session.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionId(session.getId());

        // Perform evaluations
        InterviewSummaryResponse summary = interviewEvaluationService.evaluateSession(
                session.getId(), session.getTargetRole(), session.getDifficulty(), questions, request.getAnswers()
        );

        // Save response entities in DB
        List<InterviewResponse> responsesToSave = new ArrayList<>();
        for (InterviewFeedbackResponse fb : summary.getEvaluations()) {
            responsesToSave.add(InterviewResponse.builder()
                    .questionId(fb.getQuestionId())
                    .userResponse(fb.getUserResponse())
                    .aiFeedback(fb.getAiFeedback())
                    .score(fb.getScore())
                    .improvementSuggestions(fb.getImprovementSuggestions())
                    .build());
        }
        interviewResponseRepository.saveAll(responsesToSave);

        // Complete session
        session.setStatus("COMPLETED");
        session.setScore(summary.getOverallScore());
        session.setCompletedAt(LocalDateTime.now());
        interviewSessionRepository.save(session);

        return summary;
    }

    @Transactional(readOnly = true)
    public List<InterviewSessionResponse> getHistory(String email) {
        User user = getUserByEmail(email);
        List<InterviewSession> sessions = interviewSessionRepository.findByUserId(user.getId(), Sort.by(Sort.Direction.DESC, "startedAt"));

        return sessions.stream().map(s -> {
            List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionId(s.getId());
            List<InterviewQuestionResponse> qResp = questions.stream().map(this::mapQuestionToResponse).collect(Collectors.toList());
            return mapSessionToResponse(s, qResp);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InterviewSummaryResponse getReport(UUID sessionId, String email) {
        User user = getUserByEmail(email);

        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new CustomException("Interview session not found.", HttpStatus.NOT_FOUND));

        if (!session.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionId(session.getId());
        List<UUID> qIds = questions.stream().map(InterviewQuestion::getId).collect(Collectors.toList());
        List<InterviewResponse> responses = interviewResponseRepository.findByQuestionIdIn(qIds);

        Map<UUID, InterviewResponse> responsesMap = new HashMap<>();
        for (InterviewResponse r : responses) {
            responsesMap.put(r.getQuestionId(), r);
        }

        List<InterviewFeedbackResponse> evaluations = new ArrayList<>();
        StringBuilder strBuilder = new StringBuilder();
        StringBuilder wkBuilder = new StringBuilder();
        StringBuilder learning = new StringBuilder();

        for (InterviewQuestion q : questions) {
            InterviewResponse r = responsesMap.get(q.getId());
            if (r != null) {
                evaluations.add(InterviewFeedbackResponse.builder()
                        .id(r.getId())
                        .questionId(q.getId())
                        .question(q.getQuestion())
                        .userResponse(r.getUserResponse())
                        .aiFeedback(r.getAiFeedback())
                        .score(r.getScore())
                        .improvementSuggestions(r.getImprovementSuggestions())
                        .build());
            }
        }

        // Generic overall summary templates since evaluations details are stored per response row
        strBuilder.append("- Demonstrated key conceptual understanding of core technical roles.\n");
        strBuilder.append("- Structured problem solving approach.");
        wkBuilder.append("- Focus on detailing concrete framework workflows and code syntax targets.");
        learning.append("### study recommendations\n- Review standard system design parameters, API gateways scaling, and caching integrations.");

        return InterviewSummaryResponse.builder()
                .sessionId(session.getId())
                .targetRole(session.getTargetRole())
                .difficulty(session.getDifficulty())
                .overallScore(session.getScore() != null ? session.getScore() : 0)
                .evaluations(evaluations)
                .strengths(strBuilder.toString())
                .weaknesses(wkBuilder.toString())
                .learningRoadmap(learning.toString())
                .completedAt(session.getCompletedAt())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private InterviewQuestionResponse mapQuestionToResponse(InterviewQuestion q) {
        return InterviewQuestionResponse.builder()
                .id(q.getId())
                .sessionId(q.getSessionId())
                .question(q.getQuestion())
                .category(q.getCategory())
                .difficulty(q.getDifficulty())
                .expectedAnswer(q.getExpectedAnswer())
                .hints(q.getHints())
                .build();
    }

    private InterviewSessionResponse mapSessionToResponse(InterviewSession s, List<InterviewQuestionResponse> qList) {
        return InterviewSessionResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .resumeId(s.getResumeId())
                .jobDescriptionId(s.getJobDescriptionId())
                .interviewType(s.getInterviewType())
                .targetRole(s.getTargetRole())
                .difficulty(s.getDifficulty())
                .status(s.getStatus())
                .score(s.getScore())
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .questions(qList)
                .build();
    }
}
