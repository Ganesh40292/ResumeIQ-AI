package com.resumeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_descriptions", indexes = {
    @Index(name = "idx_job_descriptions_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    private String location;

    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "experience_required")
    private Integer experienceRequired;

    @Lob
    @Column(name = "job_description_text", columnDefinition = "TEXT", nullable = false)
    private String jobDescription;

    @Lob
    @Column(name = "required_skills", columnDefinition = "TEXT")
    private String requiredSkills;

    @Lob
    @Column(name = "preferred_skills", columnDefinition = "TEXT")
    private String preferredSkills;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
