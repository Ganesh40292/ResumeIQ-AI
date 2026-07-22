import { useState, useRef } from 'react';
import axios from 'axios';
import resumeService from '../services/resumeService';

export default function useUpload() {
  const [uploadState, setUploadState] = useState({
    status: 'idle', // idle, validating, uploading, success, error
    progress: 0,
    error: null,
    uploadedResume: null,
  });
  const cancelSourceRef = useRef(null);

  const validateFile = (file) => {
    if (!file) {
      return 'Please select a file to upload.';
    }

    // 5MB limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size exceeds the maximum limit of 5 MB.';
    }

    // PDF and DOCX only
    const allowedExtensions = ['pdf', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return 'Only PDF and DOCX files are allowed.';
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      return 'Invalid file type content. Only PDF and DOCX files are accepted.';
    }

    return null;
  };

  const upload = async (file, resumeTitle = '') => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: validationError,
        uploadedResume: null,
      });
      return false;
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      error: null,
      uploadedResume: null,
    });

    cancelSourceRef.current = axios.CancelToken.source();

    try {
      const response = await resumeService.uploadResume(
        file,
        resumeTitle,
        (progress) => {
          setUploadState((prev) => ({ ...prev, progress }));
        },
        cancelSourceRef.current.token
      );

      if (response.success) {
        setUploadState({
          status: 'success',
          progress: 100,
          error: null,
          uploadedResume: response.data,
        });
        return true;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        setUploadState({
          status: 'idle',
          progress: 0,
          error: null,
          uploadedResume: null,
        });
      } else {
        const errMsg = err.response?.data?.message || err.message || 'An error occurred during upload.';
        setUploadState({
          status: 'error',
          progress: 0,
          error: errMsg,
          uploadedResume: null,
        });
      }
      return false;
    }
  };

  const cancel = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel('Upload cancelled by user.');
    }
  };

  const reset = () => {
    setUploadState({
      status: 'idle',
      progress: 0,
      error: null,
      uploadedResume: null,
    });
  };

  return {
    ...uploadState,
    upload,
    cancel,
    reset,
  };
}
