package com.resumeiq.service;

import com.resumeiq.dto.request.CareerGoalRequest;
import com.resumeiq.dto.response.CareerGoalResponse;
import com.resumeiq.entity.CareerGoal;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.CareerGoalRepository;
import com.resumeiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressTrackingService {

    private final CareerGoalRepository careerGoalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CareerGoalResponse> getGoals(String email) {
        User user = getUserByEmail(email);
        List<CareerGoal> list = careerGoalRepository.findByUserId(user.getId(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CareerGoalResponse createGoal(CareerGoalRequest request, String email) {
        User user = getUserByEmail(email);

        CareerGoal goal = CareerGoal.builder()
                .userId(user.getId())
                .title(request.getTitle())
                .progress(request.getProgress() != null ? request.getProgress() : 0)
                .completed(request.getCompleted() != null ? request.getCompleted() : false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        CareerGoal saved = careerGoalRepository.save(goal);
        return mapToResponse(saved);
    }

    @Transactional
    public CareerGoalResponse updateGoal(UUID goalId, CareerGoalRequest request, String email) {
        User user = getUserByEmail(email);
        CareerGoal goal = careerGoalRepository.findById(goalId)
                .orElseThrow(() -> new CustomException("Goal not found.", HttpStatus.NOT_FOUND));

        if (!goal.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        if (request.getTitle() != null) goal.setTitle(request.getTitle());
        if (request.getProgress() != null) goal.setProgress(request.getProgress());
        if (request.getCompleted() != null) goal.setCompleted(request.getCompleted());
        goal.setUpdatedAt(LocalDateTime.now());

        CareerGoal updated = careerGoalRepository.save(goal);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteGoal(UUID goalId, String email) {
        User user = getUserByEmail(email);
        CareerGoal goal = careerGoalRepository.findById(goalId)
                .orElseThrow(() -> new CustomException("Goal not found.", HttpStatus.NOT_FOUND));

        if (!goal.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        careerGoalRepository.delete(goal);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private CareerGoalResponse mapToResponse(CareerGoal g) {
        return CareerGoalResponse.builder()
                .id(g.getId())
                .userId(g.getUserId())
                .title(g.getTitle())
                .progress(g.getProgress())
                .completed(g.getCompleted())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .build();
    }
}
