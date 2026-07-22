package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "career_analytics", indexes = {
    @Index(name = "idx_career_analytics_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "current_ats_score")
    private Integer currentAtsScore;

    @Column(name = "highest_ats_score")
    private Integer highestAtsScore;

    @Column(name = "average_ats_score")
    private Integer averageAtsScore;

    @Column(name = "total_resume_versions")
    private Integer totalResumeVersions;

    @Column(name = "total_job_matches")
    private Integer totalJobMatches;

    @Column(name = "total_interview_sessions")
    private Integer totalInterviewSessions;

    @Column(name = "average_interview_score")
    private Integer averageInterviewScore;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "profile_completion")
    private Integer profileCompletion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
