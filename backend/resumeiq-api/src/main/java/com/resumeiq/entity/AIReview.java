package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_reviews", indexes = {
    @Index(name = "idx_ai_reviews_resume_id", columnList = "resume_id"),
    @Index(name = "idx_ai_reviews_resume_type", columnList = "resume_id, review_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "resume_id", nullable = false)
    private UUID resumeId;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Lob
    @Column(name = "ai_response", columnDefinition = "TEXT", nullable = false)
    private String aiResponse;

    @Column(name = "review_type", nullable = false)
    private String reviewType;

    @Column(name = "processing_time")
    private Long processingTime;

    @Column(name = "token_usage")
    private Integer tokenUsage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
