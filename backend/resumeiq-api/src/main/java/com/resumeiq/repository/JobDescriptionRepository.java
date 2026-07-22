package com.resumeiq.repository;

import com.resumeiq.entity.JobDescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, UUID> {
    Page<JobDescription> findByUserId(UUID userId, Pageable pageable);
    List<JobDescription> findByUserId(UUID userId);
}
