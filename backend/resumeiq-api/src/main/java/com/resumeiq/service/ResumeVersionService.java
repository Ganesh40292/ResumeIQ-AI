package com.resumeiq.service;

import com.resumeiq.dto.response.ResumeVersionResponse;
import com.resumeiq.entity.Resume;
import com.resumeiq.entity.ResumeVersion;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.ResumeVersionRepository;
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
public class ResumeVersionService {

    private final ResumeVersionRepository resumeVersionRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ResumeVersionResponse> getHistory(UUID resumeId, String email) {
        User user = getUserByEmail(email);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        List<ResumeVersion> list = resumeVersionRepository.findByResumeId(resume.getId(), Sort.by(Sort.Direction.DESC, "versionNumber"));
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public ResumeVersionResponse createVersion(UUID resumeId, String versionName, String resumeJson, String email) {
        User user = getUserByEmail(email);
        
        // Ownership check
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(resumeId, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Get latest version number
        int nextNum = 1;
        var latestOpt = resumeVersionRepository.findFirstByResumeIdOrderByVersionNumberDesc(resume.getId());
        if (latestOpt.isPresent()) {
            nextNum = latestOpt.get().getVersionNumber() + 1;
        }

        String name = (versionName != null && !versionName.trim().isEmpty()) 
                ? versionName.trim() 
                : "Checkpoint V" + nextNum;

        ResumeVersion version = ResumeVersion.builder()
                .resumeId(resume.getId())
                .versionName(name)
                .versionNumber(nextNum)
                .resumeJson(resumeJson)
                .createdBy(email)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ResumeVersion saved = resumeVersionRepository.save(version);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteVersion(UUID versionId, String email) {
        User user = getUserByEmail(email);
        ResumeVersion version = resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new CustomException("Resume version not found", HttpStatus.NOT_FOUND));

        Resume resume = resumeRepository.findById(version.getResumeId())
                .orElseThrow(() -> new CustomException("Associated resume not found", HttpStatus.NOT_FOUND));

        if (!resume.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        resumeVersionRepository.delete(version);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private ResumeVersionResponse mapToResponse(ResumeVersion v) {
        return ResumeVersionResponse.builder()
                .id(v.getId())
                .resumeId(v.getResumeId())
                .versionName(v.getVersionName())
                .versionNumber(v.getVersionNumber())
                .resumeJson(v.getResumeJson())
                .createdBy(v.getCreatedBy())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
