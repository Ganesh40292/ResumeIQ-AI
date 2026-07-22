import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Play, RefreshCw, Copy, Download, Sparkles, UserCheck,
  Target, Code, BookOpen, Clock, Calendar, CheckCircle, AlertTriangle,
  History, HelpCircle, Save, ChevronRight, Settings, AlignLeft
} from 'lucide-react';
import './AIReview.css';

// Services
import resumeService from '../../services/resumeService';
import aiService from '../../services/aiService';

// Common Components
import Badge from '../../components/common/Badge';

export default function AIReview() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumesLoading, setResumesLoading] = useState(false);

  // AI Review States
  const [activeTab, setActiveTab] = useState('RESUME_REVIEW'); // RESUME_REVIEW, PROJECTS_REVIEW, SUMMARY_GEN, SKILLS_REC
  const [reviewStatus, setReviewStatus] = useState('idle'); // idle, loading, reviewed, not_reviewed, failed
  const [reviewData, setReviewData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [aiError, setAiError] = useState('');
  
  // Custom focus inputs
  const [preferences, setPreferences] = useState('');

  // Loading messages loop
  const [loadingMsg, setLoadingMsg] = useState('Consulting career advisors...');
  const loadingMessages = [
    'Consulting career advisors...',
    'Tuning parameters for software profiles...',
    'Reviewing formatting structures...',
    'Matching keyword taxonomy coverages...',
    'Formulating prioritized action plans...',
    'Optimizing project rewrite templates...'
  ];

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchResumesList = async () => {
    setResumesLoading(true);
    try {
      const response = await resumeService.getAllResumes();
      if (response.success) {
        const list = response.data || [];
        setResumes(list);
        if (list.length > 0) {
          setSelectedResumeId(list[0].id);
        }
      }
    } catch (err) {
      showToast('error', 'Failed to fetch resume library.');
    } finally {
      setResumesLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await aiService.getHistory();
      if (response.success) {
        setHistoryList(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load review logs history', err);
    }
  };

  useEffect(() => {
    fetchResumesList();
    fetchHistory();
  }, []);

  // Interval loop for loading messages
  useEffect(() => {
    let index = 0;
    let interval;
    if (reviewStatus === 'loading') {
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[index]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [reviewStatus]);

  // Handle selected resume or tab change
  useEffect(() => {
    if (!selectedResumeId) {
      setReviewStatus('idle');
      setReviewData(null);
      return;
    }

    // Check if we already have a cached review of this type in history
    const cached = historyList.find(
      (h) => h.resumeId === selectedResumeId && h.reviewType === activeTab
    );

    if (cached) {
      setReviewData(cached);
      setReviewStatus('reviewed');
    } else {
      setReviewStatus('not_reviewed');
      setReviewData(null);
    }
    setAiError('');
  }, [selectedResumeId, activeTab, historyList]);

  // Trigger Gemini AI generation
  const handleGenerateReview = async () => {
    if (!selectedResumeId) return;

    setReviewStatus('loading');
    setAiError('');

    try {
      let response;
      switch (activeTab) {
        case 'RESUME_REVIEW':
          response = await aiService.reviewResume(selectedResumeId, preferences);
          break;
        case 'PROJECTS_REVIEW':
          response = await aiService.reviewProjects(selectedResumeId, preferences);
          break;
        case 'SUMMARY_GEN':
          response = await aiService.generateSummary(selectedResumeId, preferences);
          break;
        case 'SKILLS_REC':
          response = await aiService.recommendSkills(selectedResumeId, preferences);
          break;
        default:
          throw new Error('Invalid active tab type');
      }

      if (response.success) {
        setReviewData(response.data);
        setReviewStatus('reviewed');
        fetchHistory(); // Refresh history logs
        showToast('success', 'AI feedback compiled successfully!');
      } else {
        throw new Error(response.message || 'AI review execution failed');
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'Please parse the resume under "Resume Analysis" first before requesting AI review.');
      setReviewStatus('failed');
      showToast('error', 'AI analysis failed.');
    }
  };

  // Load a historic review
  const handleLoadHistoricReview = (historyItem) => {
    setReviewData(historyItem);
    setReviewStatus('reviewed');
    setActiveTab(historyItem.reviewType);
    showToast('success', 'Loaded previous evaluation cache.');
  };

  // Copy Markdown to Clipboard
  const handleCopyText = () => {
    if (!reviewData?.responseMarkdown) return;
    navigator.clipboard.writeText(reviewData.responseMarkdown)
      .then(() => showToast('success', 'Markdown copied to clipboard.'))
      .catch(() => showToast('error', 'Copy failed.'));
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    if (!reviewData?.responseMarkdown) return;
    const blob = new Blob([reviewData.responseMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_review_${activeTab.toLowerCase()}_${selectedResumeId.substring(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('success', 'Review report downloaded.');
  };

  // Custom Inline Markdown Parser for premium rendering without libraries
  const renderMarkdown = (mdText) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    let insideUl = false;
    let listItems = [];
    const elements = [];

    const flushList = (key) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="my-3 pl-5 space-y-1">
            {listItems.map((item, idx) => (
              <li key={`li-${key}-${idx}`} className="list-disc text-slate-350 text-xs">
                {parseInlineText(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        insideUl = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Blockquotes / Alerts
      if (trimmed.startsWith('>')) {
        flushList(i);
        const alertContent = trimmed.substring(1).trim();
        elements.push(
          <blockquote key={`bq-${i}`} className="border-l-4 border-indigo-500 bg-indigo-950/20 px-4 py-3 rounded-lg my-3 font-semibold text-indigo-300 italic text-xs">
            {parseInlineText(alertContent)}
          </blockquote>
        );
        continue;
      }

      // Headers
      if (trimmed.startsWith('###')) {
        flushList(i);
        elements.push(
          <h4 key={`h3-${i}`} className="text-sm font-bold text-slate-100 mt-4 mb-2">
            {parseInlineText(trimmed.substring(3).trim())}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('##')) {
        flushList(i);
        elements.push(
          <h3 key={`h2-${i}`} className="text-base font-extrabold text-slate-100 mt-5 mb-2 border-b border-slate-900 pb-1.5">
            {parseInlineText(trimmed.substring(2).trim())}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('#')) {
        flushList(i);
        elements.push(
          <h2 key={`h1-${i}`} className="text-lg font-extrabold text-slate-200 mt-6 mb-3">
            {parseInlineText(trimmed.substring(1).trim())}
          </h2>
        );
        continue;
      }

      // Unordered lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        insideUl = true;
        listItems.push(trimmed.substring(1).trim());
        continue;
      }

      // Normal lines / Paragraphs
      if (trimmed === '') {
        flushList(i);
        continue;
      }

      // Default paragraph line
      flushList(i);
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-400 leading-relaxed mb-3">
          {parseInlineText(trimmed)}
        </p>
      );
    }

    // Flush any leftover list at end
    flushList(lines.length);

    return <div className="markdown-wrapper text-left">{elements}</div>;
  };

  // Sub-parser for bold structures and code scopes
  const parseInlineText = (text) => {
    // Escape or remove alert labels from markdown text
    let cleanText = text.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, '');

    // Matches **bold text**
    const parts = cleanText.split(/(\*\*.*?\*\*|`.*?`)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-slate-100 font-extrabold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="font-mono bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-emerald-450 text-[10px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const getActiveResumeName = () => {
    const active = resumes.find((r) => r.id === selectedResumeId);
    return active ? active.resumeTitle : 'Resume';
  };

  const activeHistory = historyList.filter((h) => h.resumeId === selectedResumeId);

  return (
    <div className="page-aireview flex flex-col gap-8 pb-16">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="margin-0 bg-gradient-to-r from-indigo-300 via-slate-200 to-indigo-400 bg-clip-text text-transparent text-left text-2xl font-extrabold tracking-tight">
            AI Career Assistant
          </h1>
          <p className="text-left text-slate-500 text-xs mt-1">
            Leverage Google Gemini AI to analyze, rewrite, and suggest improvements.
          </p>
        </div>

        {/* Global Toolbar controls */}
        {reviewStatus === 'reviewed' && reviewData && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Copy size={13} /> Copy Markdown
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download size={13} /> Export MD
            </button>
            <button
              onClick={handleGenerateReview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Regenerate Audit
            </button>
          </div>
        )}
      </div>

      {/* Grid container */}
      <div className="ai-container">
        {/* Left selector sidebar */}
        <div className="flex flex-col gap-6">
          <div className="resume-sidebar">
            <h3 className="sidebar-title">Select Resume</h3>
            {resumesLoading ? (
              <div className="space-y-2 py-4">
                <div className="skeleton-item h-10 w-full" />
                <div className="skeleton-item h-10 w-full" />
              </div>
            ) : resumes.length > 0 ? (
              <div className="resume-select-list">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedResumeId(r.id)}
                    className={`resume-select-item ${selectedResumeId === r.id ? 'active' : ''}`}
                  >
                    <FileText className="resume-select-icon shrink-0" size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="resume-select-name" title={r.resumeTitle}>{r.resumeTitle}</div>
                      <div className="resume-select-date">
                        {new Date(r.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No resumes uploaded yet. Upload a resume first.
              </div>
            )}
          </div>

          {/* Historical Review Cache */}
          {activeHistory.length > 0 && (
            <div className="resume-sidebar">
              <h3 className="sidebar-title flex items-center gap-1.5">
                <History size={14} className="text-indigo-400" /> Review History ({activeHistory.length})
              </h3>
              <div className="resume-select-list max-h-[250px]">
                {activeHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLoadHistoricReview(item)}
                    className="resume-select-item border-slate-900 hover:border-slate-800 p-2"
                  >
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-indigo-400 font-bold uppercase shrink-0">
                          {item.reviewType?.replace('_', ' ')}
                        </span>
                        {reviewData?.id === item.id && (
                          <span className="text-[9px] text-emerald-450 font-bold">Active</span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content pane */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Tabs selector */}
          <div className="ai-tabs-list">
            <button
              onClick={() => setActiveTab('RESUME_REVIEW')}
              className={`ai-tab-btn ${activeTab === 'RESUME_REVIEW' ? 'active' : ''}`}
            >
              <UserCheck size={14} /> Resume Audit
            </button>
            <button
              onClick={() => setActiveTab('PROJECTS_REVIEW')}
              className={`ai-tab-btn ${activeTab === 'PROJECTS_REVIEW' ? 'active' : ''}`}
            >
              <Code size={14} /> Projects Rewrite
            </button>
            <button
              onClick={() => setActiveTab('SUMMARY_GEN')}
              className={`ai-tab-btn ${activeTab === 'SUMMARY_GEN' ? 'active' : ''}`}
            >
              <AlignLeft size={14} /> Summaries & Bios
            </button>
            <button
              onClick={() => setActiveTab('SKILLS_REC')}
              className={`ai-tab-btn ${activeTab === 'SKILLS_REC' ? 'active' : ''}`}
            >
              <BookOpen size={14} /> Skill Roadmaps
            </button>
          </div>

          {/* Preferences Area */}
          <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3 text-left">
            <h4 className="text-[10px] text-slate-500 font-extrabold uppercase flex items-center gap-1.5 tracking-wider">
              <Settings size={12} className="text-indigo-400" /> Focus Preferences (Optional)
            </h4>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. 'Targeting a Senior Backend Cloud role', 'Highlight DevOps pipeline knowledge', 'Optimize formatting for FAANG standard templates'"
              className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:border-indigo-650 focus:outline-none w-full min-h-[50px] resize-y placeholder-slate-650"
            />
          </div>

          {/* View Presentation */}
          <AnimatePresence mode="wait">
            {/* 1. Loading State */}
            {reviewStatus === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-16 bg-slate-900/20 border border-slate-850 rounded-3xl"
              >
                <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
                  <Sparkles className="text-indigo-400 animate-pulse" size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">Analyzing with Gemini AI</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">{loadingMsg}</p>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </motion.div>
            )}

            {/* 2. Not Reviewed */}
            {reviewStatus === 'not_reviewed' && (
              <motion.div
                key="not_reviewed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-16 bg-slate-900/20 border border-slate-850 rounded-3xl text-center"
              >
                <div className="w-16 h-16 bg-slate-900 text-indigo-400 border border-slate-850 rounded-2xl flex items-center justify-center mb-5">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">AI Review Pending</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                  Generate localized AI evaluations for "{getActiveResumeName()}" under the {activeTab.replace('_', ' ').toLowerCase()} template.
                </p>
                <button
                  onClick={handleGenerateReview}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Sparkles size={12} /> Audit with Gemini
                </button>
              </motion.div>
            )}

            {/* 3. Failed State */}
            {reviewStatus === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-16 bg-red-950/5 border border-red-900/20 rounded-3xl text-center"
              >
                <div className="w-16 h-16 bg-red-950/20 text-red-400 border border-red-900/30 rounded-2xl flex items-center justify-center mb-5">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-bold text-red-400 mb-2">Audit Interrupted</h3>
                <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
                  {aiError}
                </p>
                <button
                  onClick={handleGenerateReview}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} /> Try Again
                </button>
              </motion.div>
            )}

            {/* 4. Markdown Result View */}
            {reviewStatus === 'reviewed' && reviewData && (
              <motion.div
                key="reviewed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="ai-card-glow text-left"
              >
                {/* Generation meta info */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-indigo-400" /> Compiled in {reviewData.processingTime} ms
                  </span>
                  <span>
                    Gemini Flash 1.5
                  </span>
                </div>

                {/* Markdown text details */}
                <div className="space-y-4">
                  {renderMarkdown(reviewData.responseMarkdown)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Alert Popups */}
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
