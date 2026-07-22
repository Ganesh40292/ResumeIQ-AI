package com.resumeiq.repository;

import com.resumeiq.entity.CareerGoal;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CareerGoalRepository extends JpaRepository<CareerGoal, UUID> {
    List<CareerGoal> findByUserId(UUID userId, Sort sort);
}
