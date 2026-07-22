package com.resumeiq.repository;

import com.resumeiq.entity.ParsedResume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParsedResumeRepository extends JpaRepository<ParsedResume, UUID> {
    Optional<ParsedResume> findByResumeId(UUID resumeId);
    boolean existsByResumeId(UUID resumeId);
}
