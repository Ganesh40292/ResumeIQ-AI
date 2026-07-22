package com.resumeiq.repository;

import com.resumeiq.entity.ATSReport;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ATSReportRepository extends JpaRepository<ATSReport, UUID> {
    Optional<ATSReport> findByResumeId(UUID resumeId);
    List<ATSReport> findByResumeIdIn(List<UUID> resumeIds, Sort sort);
}
