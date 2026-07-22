package com.resumeiq.repository;

import com.resumeiq.entity.ResumeVersion;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, UUID> {
    List<ResumeVersion> findByResumeId(UUID resumeId, Sort sort);
    Optional<ResumeVersion> findFirstByResumeIdOrderByVersionNumberDesc(UUID resumeId);
}
