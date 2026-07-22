package com.resumeiq.repository;

import com.resumeiq.entity.InterviewResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewResponseRepository extends JpaRepository<InterviewResponse, UUID> {
    Optional<InterviewResponse> findByQuestionId(UUID questionId);
    List<InterviewResponse> findByQuestionIdIn(List<UUID> questionIds);
}
