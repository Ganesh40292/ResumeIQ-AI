package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ats_reports", indexes = {
    @Index(name = "idx_ats_reports_resume_id", columnList = "resume_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ATSReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "resume_id", nullable = false, unique = true)
    private UUID resumeId;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Column(name = "formatting_score", nullable = false)
    private Integer formattingScore;

    @Column(name = "education_score", nullable = false)
    private Integer educationScore;

    @Column(name = "experience_score", nullable = false)
    private Integer experienceScore;

    @Column(name = "projects_score", nullable = false)
    private Integer projectsScore;

    @Column(name = "skills_score", nullable = false)
    private Integer skillsScore;

    @Column(name = "keyword_score", nullable = false)
    private Integer keywordScore;

    @Column(name = "achievements_score", nullable = false)
    private Integer achievementsScore;

    @Column(name = "readability_score", nullable = false)
    private Integer readabilityScore;

    @Column(name = "structure_score", nullable = false)
    private Integer structureScore;

    @Lob
    @Column(name = "keyword_results", columnDefinition = "TEXT", nullable = false)
    private String keywordResults;

    @Lob
    @Column(name = "suggestions", columnDefinition = "TEXT", nullable = false)
    private String suggestions;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
