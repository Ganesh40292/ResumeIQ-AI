package com.resumeiq.repository;

import com.resumeiq.entity.Resume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, UUID> {

    List<Resume> findByUserIdAndIsDeletedFalse(UUID userId, Sort sort);

    Page<Resume> findByUserIdAndIsDeletedFalse(UUID userId, Pageable pageable);

    Optional<Resume> findByIdAndUserIdAndIsDeletedFalse(UUID id, UUID userId);

    Optional<Resume> findByUserIdAndIsDefaultResumeTrueAndIsDeletedFalse(UUID userId);

    Optional<Resume> findFirstByUserIdAndResumeTitleAndIsDeletedFalseOrderByResumeVersionDesc(UUID userId, String resumeTitle);
}
