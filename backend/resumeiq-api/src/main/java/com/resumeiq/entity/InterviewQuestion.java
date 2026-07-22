package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "interview_questions", indexes = {
    @Index(name = "idx_interview_questions_session_id", columnList = "session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    private String category;

    private String difficulty;

    @Lob
    @Column(name = "expected_answer", columnDefinition = "TEXT")
    private String expectedAnswer;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String hints;
}
