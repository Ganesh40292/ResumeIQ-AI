import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Play, RefreshCw, Printer, Download, Copy, CheckCircle2,
  AlertCircle, AlertTriangle, ShieldCheck, Search, Filter, Sparkles,
  Calendar, CheckSquare, ClipboardList, Info, Circle, Plus, Trash2,
  FileCode, Upload, ArrowRight, Check, BookOpen, ClipboardCheck
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import './JobMatcher.css';

// Services
import resumeService from '../../services/resumeService';
import jobMatchingService from '../../services/jobMatchingService';

// Common Components
import Badge from '../../components/common/Badge';

export default function JobMatcher() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumesLoading, setResumesLoading] = useState(false);

  // Job Descriptions templates list
  const [jdTemplates, setJdTemplates] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState('');

  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [experienceRequired, setExperienceRequired] = useState(0);
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');

  // Matching Report States
  const [matchStatus, setMatchStatus] = useState('idle'); // idle, loading, matched, failed
  const [reportData, setReportData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [matchError, setMatchError] = useState('');

  // Interactive local "learning" skills tracker
  const [learningSkills, setLearningSkills] = useState(new Set());

  // Search & History filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState('NEWEST');

  // Skill gap filter tab
  const [skillGapFilter, setSkillGapFilter] = useState('ALL'); // ALL, CRITICAL, IMPORTANT, OPTIONAL
  // Copied suggestion tracker
  const [copiedSuggestion, setCopiedSuggestion] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Circular score config
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const fetchInitialData = async () => {
    setResumesLoading(true);
    try {
      const resumeResp = await resumeService.getAllResumes();
      if (resumeResp.success) {
        const list = resumeResp.data || [];
        setResumes(list);
        if (list.length > 0) {
          setSelectedResumeId(list[0].id);
        }
      }

      const templatesResp = await jobMatchingService.getJobDescriptions();
      if (templatesResp.success) {
        setJdTemplates(templatesResp.data || []);
      }

      fetchHistory();
    } catch (err) {
      showToast('error', 'Failed to retrieve initial workspace details.');
    } finally {
      setResumesLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await jobMatchingService.getHistory();
      if (response.success) {
        setHistoryList(response.data || []);
      }
    } catch (err) {
      console.error('Failed to retrieve matching history', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle template selection
  useEffect(() => {
    if (!selectedJdId) {
      // Clear fields
      setJobTitle('');
      setCompanyName('');
      setExperienceRequired(0);
      setRequiredSkills('');
      setPreferredSkills('');
      setJobDescriptionText('');
      return;
    }

    const template = jdTemplates.find((j) => j.id === selectedJdId);
    if (template) {
      setJobTitle(template.jobTitle || '');
      setCompanyName(template.companyName || '');
      setExperienceRequired(template.experienceRequired || 0);
      setRequiredSkills(template.requiredSkills || '');
      setPreferredSkills(template.preferredSkills || '');
      setJobDescriptionText(template.jobDescription || '');
    }
  }, [selectedJdId, jdTemplates]);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Upload TXT job description file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      showToast('error', 'Only plain text (.txt) files are supported directly. Copy-paste PDF contents instead.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setJobDescriptionText(event.target.result);
      showToast('success', 'Job description text loaded successfully.');
    };
    reader.readAsText(file);
  };

  // Trigger matching audit
  const handleAnalyzeMatch = async () => {
    if (!selectedResumeId) {
      showToast('error', 'Select a resume from your library first.');
      return;
    }

    if (!jobTitle.trim() || !jobDescriptionText.trim()) {
      showToast('error', 'Job Title and Description body text are required.');
      return;
    }

    setMatchStatus('loading');
    setMatchError('');

    const payload = {
      resumeId: selectedResumeId,
      jobDetails: {
        jobTitle,
        companyName,
        location: '',
        employmentType: 'Full-Time',
        experienceRequired,
        requiredSkills,
        preferredSkills,
        jobDescription: jobDescriptionText
      }
    };

    try {
      const response = await jobMatchingService.analyzeMatch(payload);
      if (response.success) {
        setReportData(response.data);
        setMatchStatus('matched');
        fetchHistory(); // refresh history timeline
        setLearningSkills(new Set()); // reset local learning badges
        showToast('success', 'Match analysis complete!');
        // Refresh JD templates list
        const jdResp = await jobMatchingService.getJobDescriptions();
        if (jdResp.success) {
          setJdTemplates(jdResp.data || []);
        }
      } else {
        throw new Error(response.message || 'Analysis failed');
      }
    } catch (err) {
      setMatchError(err.response?.data?.message || 'Please parse this resume under "Resume Analysis" first before matching.');
      setMatchStatus('failed');
      showToast('error', 'Match calculation failed.');
    }
  };

  // Load a historic report
  const handleLoadHistoricReport = (report) => {
    setReportData(report);
    setMatchStatus('matched');
    setJobTitle(report.jobTitle);
    setCompanyName(report.companyName);
    setLearningSkills(new Set());
    showToast('success', 'Loaded previous match report.');
  };

  // Delete historic report
  const handleDeleteReport = async (reportId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this match history entry?')) return;
    try {
      const response = await jobMatchingService.deleteReport(reportId);
      if (response.success) {
        showToast('success', 'Match history deleted.');
        if (reportData?.id === reportId) {
          setReportData(null);
          setMatchStatus('idle');
        }
        fetchHistory();
      }
    } catch (err) {
      showToast('error', 'Deletion failed.');
    }
  };

  // Toggle skill in local learning list
  const toggleLearningSkill = (skill) => {
    setLearningSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) {
        next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-score-green';
    if (score >= 60) return 'text-score-yellow';
    return 'text-score-red';
  };

  const getScoreBgClass = (score) => {
    if (score >= 80) return 'bg-score-green';
    if (score >= 60) return 'bg-score-yellow';
    return 'bg-score-red';
  };

  const getScoreStatusText = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Average Match';
    return 'Poor Alignment';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match_report_${reportData.jobTitle.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('success', 'JSON report exported.');
  };

  // Recharts mapped structures
  const getRadarData = () => {
    if (!reportData) return [];
    return [
      { subject: 'Skills', A: reportData.skillsMatchScore, fullMark: 100 },
      { subject: 'Experience', A: reportData.experienceMatchScore, fullMark: 100 },
      { subject: 'Education', A: reportData.educationMatchScore, fullMark: 100 },
      { subject: 'Keywords', A: reportData.keywordMatchScore, fullMark: 100 },
    ];
  };

  const getPieData = () => {
    if (!reportData) return [];
    const missingCount = (reportData.skillGap?.criticalSkills?.length || 0) +
                         (reportData.skillGap?.importantSkills?.length || 0);
    const matchedCount = 10; // estimate matched
    return [
      { name: 'Matched indicators', value: matchedCount },
      { name: 'Missing gaps', value: missingCount },
    ];
  };

  // Filter history logs
  const getFilteredHistory = () => {
    return historyList
      .filter((item) =>
        item.jobTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.companyName.toLowerCase().includes(historySearch.toLowerCase())
      )
      .sort((a, b) => {
        if (historySort === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
        if (historySort === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
        if (historySort === 'SCORE_DESC') return b.overallMatchScore - a.overallMatchScore;
        if (historySort === 'SCORE_ASC') return a.overallMatchScore - b.overallMatchScore;
        return 0;
      });
  };

  // Custom Inline Markdown Parser
  const renderMarkdown = (mdText) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    let insideUl = false;
    let listItems = [];
    const elements = [];

    const flushList = (key) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="my-2.5 pl-5 space-y-1">
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

      if (trimmed.startsWith('>')) {
        flushList(i);
        elements.push(
          <blockquote key={`bq-${i}`} className="border-l-4 border-indigo-500 bg-indigo-950/20 px-3.5 py-2.5 rounded-lg my-3 font-semibold text-indigo-300 italic text-xs">
            {parseInlineText(trimmed.substring(1).trim())}
          </blockquote>
        );
        continue;
      }

      if (trimmed.startsWith('###')) {
        flushList(i);
        elements.push(
          <h4 key={`h3-${i}`} className="text-xs font-bold text-slate-100 mt-4 mb-2">
            {parseInlineText(trimmed.substring(3).trim())}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('##')) {
        flushList(i);
        elements.push(
          <h3 key={`h2-${i}`} className="text-sm font-extrabold text-slate-100 mt-5 mb-2 border-b border-slate-900 pb-1.5">
            {parseInlineText(trimmed.substring(2).trim())}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('#')) {
        flushList(i);
        elements.push(
          <h2 key={`h1-${i}`} className="text-base font-extrabold text-slate-200 mt-5 mb-3">
            {parseInlineText(trimmed.substring(1).trim())}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        insideUl = true;
        listItems.push(trimmed.substring(1).trim());
        continue;
      }

      if (trimmed === '') {
        flushList(i);
        continue;
      }

      flushList(i);
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-400 leading-relaxed mb-2.5">
          {parseInlineText(trimmed)}
        </p>
      );
    }

    flushList(lines.length);
    return <div className="markdown-wrapper text-left">{elements}</div>;
  };

  const parseInlineText = (text) => {
    let cleanText = text.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, '');
    const parts = cleanText.split(/(\*\*.*?\*\*|`.*?`)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-slate-100 font-extrabold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="font-mono bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-emerald-450 text-[10px]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="page-jobmatcher flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-slate-100 text-left text-2xl font-extrabold tracking-tight m-0">
            Job Description Matcher
          </h1>
          <p className="text-left text-slate-500 text-xs mt-1">
            Compare candidate profiles against job postings to audit skill gaps and descriptions.
          </p>
        </div>

        {/* Global Toolbar */}
        {matchStatus === 'matched' && reportData && (
          <div className="global-toolbar flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer size={13} /> Print/Save PDF
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download size={13} /> Export JSON
            </button>
            <button
              onClick={handleAnalyzeMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Re-evaluate JD
            </button>
          </div>
        )}
      </div>

      {/* Matching Workspace */}
      <div className="matcher-workspace print-hide">
        {/* Left Panel - Resume Selection & saved JD templates */}
        <div className="workspace-panel">
          <h3 className="panel-title">1. Candidate Resume</h3>
          {resumesLoading ? (
            <div className="skeleton-item h-12 w-full" />
          ) : resumes.length > 0 ? (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Active Resume Selector</span>
              <select
                value={selectedResumeId || ''}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none w-full cursor-pointer font-semibold"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.resumeTitle} ({r.originalFileName})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-2">
              No resumes uploaded yet. Go to Resume Manager to add files.
            </div>
          )}

          {/* Saved Job Posting Selector */}
          {jdTemplates.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-850 pt-4 mt-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Or Load Saved Job Template</span>
              <select
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none w-full cursor-pointer font-semibold"
              >
                <option value="">-- Copy-paste a new Job Posting instead --</option>
                {jdTemplates.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.jobTitle} - {j.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Panel - Job posting inputs */}
        <div className="workspace-panel">
          <h3 className="panel-title">2. Target Job posting</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Job Title *</span>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Java Engineer"
                className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Company Name</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google"
                className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Years Experience *</span>
              <input
                type="number"
                value={experienceRequired}
                onChange={(e) => setExperienceRequired(parseInt(e.target.value) || 0)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Upload Job description (.txt)</span>
              <label className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer justify-center border-dashed">
                <Upload size={14} /> Upload TXT file
                <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt" />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Required Core Skills (Comma list)</span>
            <input
              type="text"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="e.g. Java, Spring Boot, PostgreSQL"
              className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Preferred Skills (Comma list)</span>
            <input
              type="text"
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
              placeholder="e.g. Docker, AWS, Terraform"
              className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Job Description Text *</span>
            <textarea
              value={jobDescriptionText}
              onChange={(e) => setJobDescriptionText(e.target.value)}
              placeholder="Paste entire job description detail here..."
              className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none min-h-[120px]"
            />
          </div>

          <button
            onClick={handleAnalyzeMatch}
            disabled={matchStatus === 'loading'}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer w-full mt-2 disabled:opacity-50"
          >
            {matchStatus === 'loading' ? 'Calculating scores...' : 'Analyze Match'}
          </button>
        </div>
      </div>

      {/* Match Results presentation */}
      <AnimatePresence mode="wait">
        {/* 1. Loading indicators */}
        {matchStatus === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-16 bg-slate-900/20 border border-slate-850 rounded-3xl"
          >
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
              <CheckSquare className="text-indigo-400 animate-pulse" size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Analyzing Job Fit Compatibility</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-2">
              Cross-referencing required skills lists, matching experience limits, and consulting Gemini AI rewrites...
            </p>
          </motion.div>
        )}

        {/* 2. Failure error state */}
        {matchStatus === 'failed' && (
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
            <h3 className="text-base font-bold text-red-400 mb-2">Match Blocked</h3>
            <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
              {matchError}
            </p>
            <button
              onClick={handleAnalyzeMatch}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Matching
            </button>
          </motion.div>
        )}

        {/* 3. Successful match outputs */}
        {matchStatus === 'matched' && reportData && (
          <motion.div
            key="matched"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div className="gauge-container col-span-1">
                <svg width="120" height="120" className="gauge-circle">
                  <circle cx="60" cy="60" r={radius} className="gauge-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className={`gauge-fill ${
                      reportData.overallMatchScore >= 80
                        ? 'stroke-emerald-500'
                        : reportData.overallMatchScore >= 60
                        ? 'stroke-amber-500'
                        : 'stroke-rose-500'
                    }`}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (reportData.overallMatchScore / 100) * circumference}
                  />
                  <text x="60" y="55" className="gauge-text">
                    {reportData.overallMatchScore}%
                  </text>
                  <text x="60" y="80" className="gauge-label">
                    MATCH
                  </text>
                </svg>
                <div className="mt-4 text-center">
                  <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${getScoreBgClass(reportData.overallMatchScore)} ${getScoreColorClass(reportData.overallMatchScore)}`}>
                    {getScoreStatusText(reportData.overallMatchScore)}
                  </span>
                </div>
              </div>

              {/* Match overview details */}
              <div className="col-span-1 md:col-span-2 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between text-left">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-indigo-400" /> Compatibility Audit: {reportData.jobTitle}
                  </h3>
                  <p className="text-xs text-slate-450 leading-relaxed mb-4">
                    Evaluating required skills and years of experience alignment. Bridge gaps by implementing recommended technologies in your portfolio and adjusting project bulletins.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Associated Company</span>
                    <span className="text-sm font-extrabold text-slate-200">
                      {reportData.companyName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Missing Required Gaps</span>
                    <span className="text-sm font-extrabold text-slate-200 text-rose-450">
                      {reportData.skillGap?.criticalSkills?.length || 0} Critical
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest text-left">
                Criteria Scorecard Breakdown
              </h3>
              <div className="breakdown-grid">
                {Object.entries({
                  'Skills Match': reportData.skillsMatchScore,
                  'Experience Match': reportData.experienceMatchScore,
                  'Education Match': reportData.educationMatchScore,
                  'Preferred Keywords': reportData.keywordMatchScore,
                }).map(([label, score]) => (
                  <div key={label} className="breakdown-card text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">{label}</span>
                      <span className={`text-xs font-bold ${getScoreColorClass(score)}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          score >= 80
                            ? 'bg-emerald-500'
                            : score >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharts comparison display */}
            <div className="charts-grid print-hide">
              <div className="chart-card">
                <h3 className="chart-title">Job Fit Radar</h3>
                <div className="w-full h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                      <PolarRadiusAxis stroke="#1e293b" angle={30} domain={[0, 100]} />
                      <Radar name="Profile Match" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Indicators Distribution</h3>
                <div className="w-full h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#f8fafc' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Categorized Skill Gaps cards */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                  Identified Skill Gaps
                </h3>
                <div className="flex items-center gap-1 bg-slate-950/50 border border-slate-850 rounded-xl p-1">
                  {[
                    { key: 'ALL', label: 'All Skills' },
                    { key: 'CRITICAL', label: 'Critical' },
                    { key: 'IMPORTANT', label: 'Important' },
                    { key: 'OPTIONAL', label: 'Optional' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSkillGapFilter(tab.key)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        skillGapFilter === tab.key
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Critical gaps */}
                {(skillGapFilter === 'ALL' || skillGapFilter === 'CRITICAL') && (
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Circle size={6} className="fill-rose-500 text-rose-500 shrink-0" /> Critical Skills (Required)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reportData.skillGap?.criticalSkills?.length > 0 ? (
                      reportData.skillGap.criticalSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          onClick={() => toggleLearningSkill(sk)}
                          className={`skill-badge-clickable text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1 bg-rose-950/20 border-rose-900/30 text-rose-400 ${
                            learningSkills.has(sk) ? 'learning' : ''
                          }`}
                        >
                          {learningSkills.has(sk) && <Check size={10} />} {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-600 italic">No missing required skills.</span>
                    )}
                  </div>
                </div>
                )}

                {/* Important gaps */}
                {(skillGapFilter === 'ALL' || skillGapFilter === 'IMPORTANT') && (
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-amber-450 uppercase tracking-wider flex items-center gap-1.5">
                    <Circle size={6} className="fill-amber-500 text-amber-500 shrink-0" /> Important Skills (Preferred)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reportData.skillGap?.importantSkills?.length > 0 ? (
                      reportData.skillGap.importantSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          onClick={() => toggleLearningSkill(sk)}
                          className={`skill-badge-clickable text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1 bg-amber-950/20 border-amber-900/30 text-amber-400 ${
                            learningSkills.has(sk) ? 'learning' : ''
                          }`}
                        >
                          {learningSkills.has(sk) && <Check size={10} />} {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-600 italic">No missing preferred skills.</span>
                    )}
                  </div>
                </div>
                )}

                {/* Optional gaps */}
                {(skillGapFilter === 'ALL' || skillGapFilter === 'OPTIONAL') && (
                <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Circle size={6} className="fill-indigo-500 text-indigo-500 shrink-0" /> Optional Skills (Bonus)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reportData.skillGap?.optionalSkills?.length > 0 ? (
                      reportData.skillGap.optionalSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          onClick={() => toggleLearningSkill(sk)}
                          className={`skill-badge-clickable text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1 bg-indigo-950/20 border-indigo-900/30 text-indigo-400 ${
                            learningSkills.has(sk) ? 'learning' : ''
                          }`}
                        >
                          {learningSkills.has(sk) && <Check size={10} />} {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-600 italic">No optional gaps detected.</span>
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Informative tips */}
              {learningSkills.size > 0 && (
                <div className="bg-indigo-950/10 border border-indigo-900/30 p-3 rounded-xl flex items-center gap-2.5 text-indigo-400 text-xs font-semibold">
                  <BookOpen size={14} className="shrink-0" />
                  <span>
                    You have marked {learningSkills.size} skills as "Learning". Focus on study templates or build minor projects to cover them!
                  </span>
                </div>
              )}
            </div>

            {/* Strengths & Weaknesses checklists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {reportData.strengths?.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 group/item">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="flex-1">{str}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(str);
                          setCopiedSuggestion(`str-${idx}`);
                          setTimeout(() => setCopiedSuggestion(null), 2000);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 shrink-0 p-1 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/20 transition-all cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedSuggestion === `str-${idx}` ? <ClipboardCheck size={12} /> : <Copy size={12} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-rose-450 uppercase tracking-widest flex items-center gap-1.5">
                  Match Weaknesses / Gaps
                </h4>
                <ul className="space-y-2">
                  {reportData.weaknesses?.map((wk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 group/item">
                      <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span className="flex-1">{wk}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(wk);
                          setCopiedSuggestion(`wk-${idx}`);
                          setTimeout(() => setCopiedSuggestion(null), 2000);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 shrink-0 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedSuggestion === `wk-${idx}` ? <ClipboardCheck size={12} /> : <Copy size={12} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Recommendations Markdown */}
            {reportData.recommendations && (
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-widest">AI Recommendations</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportData.recommendations);
                      setCopiedSuggestion('recs');
                      setTimeout(() => setCopiedSuggestion(null), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-900/30 transition-all cursor-pointer"
                  >
                    {copiedSuggestion === 'recs' ? <><ClipboardCheck size={11} /> Copied!</> : <><Copy size={11} /> Copy All</>}
                  </button>
                </div>
                {renderMarkdown(reportData.recommendations)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matching history log timeline */}
      {historyList.length > 0 && (
        <div className="history-section space-y-4 print-hide text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-900 pt-6">
            <h3 className="text-sm font-bold text-slate-300">
              Previous Job Matches History ({historyList.length})
            </h3>
            {/* Search list history */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl min-w-[200px]">
              <Search size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                className="bg-transparent border-none text-[11px] text-slate-200 placeholder-slate-650 focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="history-timeline-list">
            {getFilteredHistory().map((report) => (
              <button
                key={report.id}
                onClick={() => handleLoadHistoricReport(report)}
                className="history-item-row w-full cursor-pointer hover:bg-slate-950/20"
              >
                <div className="min-w-0 flex-1 text-left flex items-start gap-3">
                  <FileText className="text-slate-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 mb-1">{report.jobTitle}</h4>
                    <p className="text-[10px] text-slate-500">
                      Company: {report.companyName} • Evaluated: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${getScoreBgClass(report.overallMatchScore)} ${getScoreColorClass(report.overallMatchScore)}`}>
                    {report.overallMatchScore}% Match
                  </span>
                  <button
                    onClick={(e) => handleDeleteReport(report.id, e)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toast Alerts */}
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
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-semibold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
