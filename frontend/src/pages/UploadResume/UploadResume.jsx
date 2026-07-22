import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, FileText, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';
import './UploadResume.css';

// Hooks
import useUpload from '../../hooks/useUpload';
import useDebounce from '../../hooks/useDebounce';

// Services
import resumeService from '../../services/resumeService';

// Components
import DropZone from '../../components/resume/DropZone';
import UploadProgress from '../../components/resume/UploadProgress';
import ResumeCard from '../../components/resume/ResumeCard';
import ResumeFilters from '../../components/resume/ResumeFilters';
import ResumePreviewModal from '../../components/resume/ResumePreviewModal';
import RenameModal from '../../components/resume/RenameModal';
import EmptyState from '../../components/resume/EmptyState';

export default function UploadResume() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('ALL');
  const [filterDefault, setFilterDefault] = useState(false);
  const [sortBy, setSortBy] = useState('NEWEST');

  // Modal States
  const [previewResume, setPreviewResume] = useState(null);
  const [renameResume, setRenameResume] = useState(null);
  const [renameLoading, setRenameLoading] = useState(false);

  // Debounced search for performance
  const debouncedSearch = useDebounce(search, 300);

  // Upload Management Hook
  const {
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
    uploadedResume,
    upload: triggerUpload,
    cancel: cancelUpload,
    reset: resetUpload,
  } = useUpload();

  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch Resumes
  const fetchResumes = async () => {
    setLoading(true);
    try {
      const response = await resumeService.getAllResumes();
      if (response.success) {
        setResumes(response.data || []);
      }
    } catch (err) {
      showToast('error', 'Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Handle uploaded state changes from hook
  useEffect(() => {
    if (uploadStatus === 'success' && uploadedResume) {
      showToast('success', 'Resume uploaded successfully!');
      fetchResumes();
      setSelectedFile(null);
    }
  }, [uploadStatus, uploadedResume]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    triggerUpload(file);
  };

  const handleRetry = () => {
    if (selectedFile) {
      triggerUpload(selectedFile);
    }
  };

  const handleCancel = () => {
    cancelUpload();
    setSelectedFile(null);
  };

  const handleReset = () => {
    resetUpload();
    setSelectedFile(null);
  };

  // Actions
  const handlePreview = (resume) => {
    setPreviewResume(resume);
  };

  const handleDownload = async (id) => {
    try {
      await resumeService.downloadResume(id);
      showToast('success', 'Download started.');
    } catch (err) {
      showToast('error', 'Failed to download resume.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await resumeService.setDefault(id);
      if (response.success) {
        showToast('success', 'Default resume updated.');
        fetchResumes();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update default resume.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      const response = await resumeService.deleteResume(id);
      if (response.success) {
        showToast('success', 'Resume deleted successfully.');
        fetchResumes();
      }
    } catch (err) {
      showToast('error', 'Failed to delete resume.');
    }
  };

  const handleRenameClick = (resume) => {
    setRenameResume(resume);
  };

  const handleRenameSave = async (id, newTitle) => {
    setRenameLoading(true);
    try {
      const response = await resumeService.updateResume(id, newTitle);
      if (response.success) {
        showToast('success', 'Resume renamed successfully.');
        setRenameResume(null);
        fetchResumes();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to rename resume.');
    } finally {
      setRenameLoading(false);
    }
  };

  // Stats
  const totalCount = resumes.length;
  const pdfCount = resumes.filter((r) => r.fileType?.includes('pdf') || r.originalFileName?.endsWith('.pdf')).length;
  const docxCount = resumes.filter((r) => r.fileType?.includes('word') || r.originalFileName?.endsWith('.docx')).length;

  // Filter & Sort Logic
  const filteredResumes = resumes
    .filter((resume) => {
      // Search
      const matchesSearch =
        resume.resumeTitle.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        resume.originalFileName.toLowerCase().includes(debouncedSearch.toLowerCase());

      // FileType
      const isPdf = resume.fileType?.includes('pdf') || resume.originalFileName?.endsWith('.pdf');
      const isDocx = resume.fileType?.includes('word') || resume.originalFileName?.endsWith('.docx');
      const matchesType =
        fileType === 'ALL' ||
        (fileType === 'PDF' && isPdf) ||
        (fileType === 'DOCX' && isDocx);

      // Default
      const matchesDefault = !filterDefault || resume.isDefaultResume;

      return matchesSearch && matchesType && matchesDefault;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.uploadDate) - new Date(b.uploadDate);
      }
      if (sortBy === 'ALPHABETICAL') {
        return a.resumeTitle.localeCompare(b.resumeTitle);
      }
      if (sortBy === 'LARGEST') {
        return b.fileSize - a.fileSize;
      }
      if (sortBy === 'SMALLEST') {
        return a.fileSize - b.fileSize;
      }
      return 0;
    });

  const scrollUploadIntoView = () => {
    document.getElementById('upload-area')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="page-uploadresume flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="upload-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="upload-title text-left margin-0">Resume Manager</h1>
          <p className="upload-subtitle text-left">Upload, organize, and manage your resumes for ATS analysis and jobs.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <FileText size={20} />
          </div>
          <div className="text-left">
            <span className="stat-label">Total Resumes</span>
            <div className="stat-value">{totalCount}</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon-wrapper text-red-400 bg-red-950/20 border border-red-900/30">
            <FileText size={20} />
          </div>
          <div className="text-left">
            <span className="stat-label">PDF Formats</span>
            <div className="stat-value">{pdfCount}</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon-wrapper text-blue-400 bg-blue-950/20 border border-blue-900/30">
            <FileCode size={20} />
          </div>
          <div className="text-left">
            <span className="stat-label">Word Formats</span>
            <div className="stat-value">{docxCount}</div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div id="upload-area" className="upload-section">
        <DropZone onFileSelect={handleFileSelect} disabled={uploadStatus === 'uploading'} />
        
        <UploadProgress
          file={selectedFile}
          status={uploadStatus}
          progress={uploadProgress}
          error={uploadError}
          onCancel={handleCancel}
          onRetry={handleRetry}
          onReset={handleReset}
        />
      </div>

      {/* Resume Library */}
      <div className="library-section">
        <div className="library-header">
          <div className="flex items-center gap-3">
            <h2 className="library-title margin-0">Resume Library</h2>
            <span className="library-count">{filteredResumes.length}</span>
          </div>
        </div>

        {/* Filters */}
        <ResumeFilters
          search={search}
          onSearchChange={setSearch}
          fileType={fileType}
          onFileTypeChange={setFileType}
          filterDefault={filterDefault}
          onFilterDefaultChange={setFilterDefault}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {/* List of cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
            <span className="text-xs font-semibold">Updating library...</span>
          </div>
        ) : filteredResumes.length > 0 ? (
          <motion.div
            layout
            className="library-grid"
          >
            <AnimatePresence mode="popLayout">
              {filteredResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onRename={handleRenameClick}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState onUploadClick={scrollUploadIntoView} />
        )}
      </div>

      {/* Preview Modal */}
      {previewResume && (
        <ResumePreviewModal
          resume={previewResume}
          onClose={() => setPreviewResume(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Rename Modal */}
      {renameResume && (
        <RenameModal
          resume={renameResume}
          onClose={() => setRenameResume(null)}
          onSave={handleRenameSave}
          loading={renameLoading}
        />
      )}

      {/* Custom Toast Alerts */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ transform: 'translateY(1rem)', opacity: 0 }}
              animate={{ transform: 'translateY(0)', opacity: 1 }}
              exit={{ transform: 'translateY(1rem)', opacity: 0 }}
              className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
            >
              {toast.type === 'success' ? (
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-semibold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
