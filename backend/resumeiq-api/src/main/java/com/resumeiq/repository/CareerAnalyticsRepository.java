package com.resumeiq.repository;

import com.resumeiq.entity.CareerAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CareerAnalyticsRepository extends JpaRepository<CareerAnalytics, UUID> {
    Optional<CareerAnalytics> findByUserId(UUID userId);
}
