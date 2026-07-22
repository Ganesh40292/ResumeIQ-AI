package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "interview_responses", indexes = {
    @Index(name = "idx_interview_responses_question_id", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Lob
    @Column(name = "user_response", columnDefinition = "TEXT")
    private String userResponse;

    @Lob
    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    private Integer score; // Rating out of 100

    @Lob
    @Column(name = "improvement_suggestions", columnDefinition = "TEXT")
    private String improvementSuggestions;
}
