package com.resumeiq.service;

import com.resumeiq.dto.request.ResumeUpdateRequest;
import com.resumeiq.dto.response.ResumeResponse;
import com.resumeiq.dto.response.ResumeSummaryResponse;
import com.resumeiq.entity.Resume;
import com.resumeiq.entity.User;
import com.resumeiq.exception.CustomException;
import com.resumeiq.repository.ResumeRepository;
import com.resumeiq.repository.UserRepository;
import com.resumeiq.storage.local.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of("pdf", "docx");
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @Transactional
    public ResumeResponse uploadResume(MultipartFile file, String resumeTitle, String userEmail) {
        User user = getUserByEmail(userEmail);
        validateFile(file);

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String extension = getFileExtension(originalFileName);

        // Standardize title if empty
        String finalTitle = StringUtils.hasText(resumeTitle) ? resumeTitle.trim() : originalFileName;

        // Check for duplicates
        UUID userId = user.getId();
        boolean exists = resumeRepository.findByUserIdAndIsDeletedFalse(userId, Sort.unsorted())
                .stream()
                .anyMatch(r -> r.getOriginalFileName().equalsIgnoreCase(originalFileName) || r.getResumeTitle().equalsIgnoreCase(finalTitle));
        
        if (exists) {
            throw new CustomException("A resume with the same filename or title already exists.", HttpStatus.BAD_REQUEST);
        }

        // Determine version (find latest version of resumes with same title, default to 1)
        int version = 1;
        Optional<Resume> latestVersionResume = resumeRepository
                .findFirstByUserIdAndResumeTitleAndIsDeletedFalseOrderByResumeVersionDesc(userId, finalTitle);
        if (latestVersionResume.isPresent()) {
            version = latestVersionResume.get().getResumeVersion() + 1;
        }

        // Save physical file
        String relativePath = fileStorageService.storeFile(file, userId);

        // Check if this is the first resume. If so, make it default automatically.
        List<Resume> activeResumes = resumeRepository.findByUserIdAndIsDeletedFalse(userId, Sort.unsorted());
        boolean isDefault = activeResumes.isEmpty();

        Resume resume = Resume.builder()
                .userId(userId)
                .originalFileName(originalFileName)
                .storedFileName(relativePath.substring(relativePath.lastIndexOf(java.io.File.separator) + 1))
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .fileExtension(extension)
                .uploadDate(LocalDateTime.now())
                .lastModified(LocalDateTime.now())
                .resumeTitle(finalTitle)
                .resumeVersion(version)
                .storagePath(relativePath)
                .isDefaultResume(isDefault)
                .isDeleted(false)
                .build();

        Resume savedResume = resumeRepository.save(resume);
        return mapToResumeResponse(savedResume);
    }

    @Transactional(readOnly = true)
    public List<ResumeSummaryResponse> getAllResumes(String userEmail) {
        User user = getUserByEmail(userEmail);
        // Find all active (non-deleted) resumes for user, sort by default resume first, then newer first
        Sort sort = Sort.by(Sort.Order.desc("isDefaultResume"), Sort.Order.desc("uploadDate"));
        List<Resume> resumes = resumeRepository.findByUserIdAndIsDeletedFalse(user.getId(), sort);
        return resumes.stream()
                .map(this::mapToResumeSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResumeById(UUID id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));
        return mapToResumeResponse(resume);
    }

    @Transactional
    public ResumeResponse updateResume(UUID id, ResumeUpdateRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        String newTitle = request.getResumeTitle().trim();

        // Check duplicate title (excluding this resume itself)
        boolean titleExists = resumeRepository.findByUserIdAndIsDeletedFalse(user.getId(), Sort.unsorted())
                .stream()
                .anyMatch(r -> !r.getId().equals(id) && r.getResumeTitle().equalsIgnoreCase(newTitle));

        if (titleExists) {
            throw new CustomException("A resume with the title '" + newTitle + "' already exists.", HttpStatus.BAD_REQUEST);
        }

        resume.setResumeTitle(newTitle);
        resume.setLastModified(LocalDateTime.now());
        Resume updatedResume = resumeRepository.save(resume);
        return mapToResumeResponse(updatedResume);
    }

    @Transactional
    public void deleteResume(UUID id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        // Soft delete
        resume.setDeleted(true);
        resume.setLastModified(LocalDateTime.now());
        resumeRepository.save(resume);

        // If the deleted resume was default, clear default and set the latest remaining resume as default
        if (resume.isDefaultResume()) {
            resume.setDefaultResume(false);
            resumeRepository.save(resume);

            List<Resume> remainingResumes = resumeRepository.findByUserIdAndIsDeletedFalse(
                    user.getId(), 
                    Sort.by(Sort.Direction.DESC, "uploadDate")
            );
            if (!remainingResumes.isEmpty()) {
                Resume newDefault = remainingResumes.get(0);
                newDefault.setDefaultResume(true);
                resumeRepository.save(newDefault);
            }
        }
    }

    @Transactional
    public ResumeResponse restoreResume(UUID id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new CustomException("Resume not found.", HttpStatus.NOT_FOUND));

        if (!resume.getUserId().equals(user.getId())) {
            throw new CustomException("Access denied.", HttpStatus.FORBIDDEN);
        }

        if (!resume.isDeleted()) {
            throw new CustomException("Resume is not deleted.", HttpStatus.BAD_REQUEST);
        }

        resume.setDeleted(false);
        resume.setLastModified(LocalDateTime.now());
        
        // If there is no default resume, make this default
        boolean hasDefault = resumeRepository.findByUserIdAndIsDefaultResumeTrueAndIsDeletedFalse(user.getId()).isPresent();
        if (!hasDefault) {
            resume.setDefaultResume(true);
        }

        Resume restored = resumeRepository.save(resume);
        return mapToResumeResponse(restored);
    }

    @Transactional
    public ResumeResponse setDefaultResume(UUID id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume targetResume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        if (targetResume.isDefaultResume()) {
            return mapToResumeResponse(targetResume);
        }

        // Unset any current default resumes for this user
        resumeRepository.findByUserIdAndIsDefaultResumeTrueAndIsDeletedFalse(user.getId())
                .ifPresent(currentDefault -> {
                    currentDefault.setDefaultResume(false);
                    resumeRepository.save(currentDefault);
                });

        targetResume.setDefaultResume(true);
        targetResume.setLastModified(LocalDateTime.now());
        Resume updated = resumeRepository.save(targetResume);
        return mapToResumeResponse(updated);
    }

    @Transactional(readOnly = true)
    public Resource downloadResume(UUID id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Resume resume = resumeRepository.findByIdAndUserIdAndIsDeletedFalse(id, user.getId())
                .orElseThrow(() -> new CustomException("Resume not found or access denied.", HttpStatus.NOT_FOUND));

        return fileStorageService.loadFileAsResource(resume.getStoragePath());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("File cannot be empty", HttpStatus.BAD_REQUEST);
        }

        // Validate size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException("File size exceeds the limit of 5 MB.", HttpStatus.BAD_REQUEST);
        }

        // Validate extension
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null) {
            throw new CustomException("Invalid file name", HttpStatus.BAD_REQUEST);
        }

        String extension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new CustomException("Only PDF and DOCX files are allowed.", HttpStatus.BAD_REQUEST);
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new CustomException("Invalid file type content. Only PDF and DOCX files are accepted.", HttpStatus.BAD_REQUEST);
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex >= 0) {
            return filename.substring(lastIndex + 1);
        }
        return "";
    }

    private ResumeResponse mapToResumeResponse(Resume resume) {
        return ResumeResponse.builder()
                .id(resume.getId())
                .userId(resume.getUserId())
                .originalFileName(resume.getOriginalFileName())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .fileExtension(resume.getFileExtension())
                .uploadDate(resume.getUploadDate())
                .lastModified(resume.getLastModified())
                .resumeTitle(resume.getResumeTitle())
                .resumeVersion(resume.getResumeVersion())
                .isDefaultResume(resume.isDefaultResume())
                .isDeleted(resume.isDeleted())
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }

    private ResumeSummaryResponse mapToResumeSummaryResponse(Resume resume) {
        return ResumeSummaryResponse.builder()
                .id(resume.getId())
                .resumeTitle(resume.getResumeTitle())
                .originalFileName(resume.getOriginalFileName())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .uploadDate(resume.getUploadDate())
                .isDefaultResume(resume.isDefaultResume())
                .build();
    }
}
