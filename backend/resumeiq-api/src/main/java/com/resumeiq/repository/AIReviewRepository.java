package com.resumeiq.repository;

import com.resumeiq.entity.AIReview;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIReviewRepository extends JpaRepository<AIReview, UUID> {
    List<AIReview> findByResumeId(UUID resumeId, Sort sort);
    List<AIReview> findByResumeIdAndReviewType(UUID resumeId, String reviewType, Sort sort);
    List<AIReview> findByResumeIdIn(List<UUID> resumeIds, Sort sort);
}
