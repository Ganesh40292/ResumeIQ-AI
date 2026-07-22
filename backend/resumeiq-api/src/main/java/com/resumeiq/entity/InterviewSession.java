package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_sessions", indexes = {
    @Index(name = "idx_interview_sessions_user_id", columnList = "user_id"),
    @Index(name = "idx_interview_sessions_status", columnList = "user_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "resume_id")
    private UUID resumeId;

    @Column(name = "job_description_id")
    private UUID jobDescriptionId;

    @Column(name = "interview_type", nullable = false)
    private String interviewType;

    @Column(name = "target_role", nullable = false)
    private String targetRole;

    @Column(nullable = false)
    private String difficulty;

    @Column(nullable = false)
    private String status; // STARTED, COMPLETED

    private Integer score; // Overall score 0-100

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
