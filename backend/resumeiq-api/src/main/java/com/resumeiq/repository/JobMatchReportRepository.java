package com.resumeiq.repository;

import com.resumeiq.entity.JobMatchReport;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobMatchReportRepository extends JpaRepository<JobMatchReport, UUID> {
    Optional<JobMatchReport> findByResumeIdAndJobDescriptionId(UUID resumeId, UUID jobDescriptionId);
    List<JobMatchReport> findByResumeIdIn(List<UUID> resumeIds, Sort sort);
}
