package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_match_reports", indexes = {
    @Index(name = "idx_job_match_reports_resume_jd", columnList = "resume_id, job_description_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobMatchReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "resume_id", nullable = false)
    private UUID resumeId;

    @Column(name = "job_description_id", nullable = false)
    private UUID jobDescriptionId;

    @Column(name = "overall_match_score", nullable = false)
    private Integer overallMatchScore;

    @Column(name = "skills_match_score", nullable = false)
    private Integer skillsMatchScore;

    @Column(name = "experience_match_score", nullable = false)
    private Integer experienceMatchScore;

    @Column(name = "education_match_score", nullable = false)
    private Integer educationMatchScore;

    @Column(name = "keyword_match_score", nullable = false)
    private Integer keywordMatchScore;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Lob
    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
