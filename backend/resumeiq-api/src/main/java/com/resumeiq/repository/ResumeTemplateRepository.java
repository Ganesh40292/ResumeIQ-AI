package com.resumeiq.repository;

import com.resumeiq.entity.ResumeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeTemplateRepository extends JpaRepository<ResumeTemplate, UUID> {
    Optional<ResumeTemplate> findByTemplateName(String templateName);
}
