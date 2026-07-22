package com.resumeiq.storage.local;

import com.resumeiq.exception.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.file.upload-dir:uploads/resumes}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new CustomException("Could not create the directory where the uploaded files will be stored.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String storeFile(MultipartFile file, UUID userId) {
        // Clean path and check path traversal
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (originalFileName.contains("..")) {
            throw new CustomException("Filename contains invalid path sequence " + originalFileName, HttpStatus.BAD_REQUEST);
        }

        // Create user directory
        Path userStorageLocation = this.fileStorageLocation.resolve(userId.toString()).normalize();
        try {
            Files.createDirectories(userStorageLocation);
        } catch (IOException e) {
            throw new CustomException("Could not create user directory: " + userId, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Generate unique name: prefixing with uuid
        String extension = "";
        int lastIndex = originalFileName.lastIndexOf('.');
        if (lastIndex >= 0) {
            extension = originalFileName.substring(lastIndex);
        }
        
        String storedFileName = UUID.randomUUID().toString() + extension;
        Path targetLocation = userStorageLocation.resolve(storedFileName);

        try {
            // Check if file already exists (UUID makes it extremely unlikely, but let's make sure)
            if (Files.exists(targetLocation)) {
                throw new CustomException("File already exists at target location.", HttpStatus.CONFLICT);
            }
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            // Return path relative to fileStorageLocation or absolute path. Let's return path string that allows easy lookup.
            // Relativized path from fileStorageLocation: e.g. "{userId}/{storedFileName}"
            return this.fileStorageLocation.relativize(targetLocation).toString();
        } catch (IOException ex) {
            throw new CustomException("Could not store file " + originalFileName + ". Please try again!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Resource loadFileAsResource(String relativeStoragePath) {
        try {
            Path filePath = this.fileStorageLocation.resolve(relativeStoragePath).normalize();
            // Path traversal check
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new CustomException("Access denied: invalid file path query.", HttpStatus.FORBIDDEN);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new CustomException("File not found: " + relativeStoragePath, HttpStatus.NOT_FOUND);
            }
        } catch (MalformedURLException ex) {
            throw new CustomException("File not found: " + relativeStoragePath, HttpStatus.NOT_FOUND);
        }
    }

    public void deleteFile(String relativeStoragePath) {
        try {
            Path filePath = this.fileStorageLocation.resolve(relativeStoragePath).normalize();
            // Path traversal check
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new CustomException("Access denied: invalid file path delete request.", HttpStatus.FORBIDDEN);
            }
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new CustomException("Error deleting physical file: " + relativeStoragePath, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
