import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Play, RefreshCw, Printer, Download, Copy, CheckCircle2,
  AlertCircle, AlertTriangle, ShieldCheck, Search, Filter, Sparkles,
  Calendar, CheckSquare, ClipboardList, Info, Circle, ClipboardCheck
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './ATSReport.css';

// Services
import resumeService from '../../services/resumeService';
import atsService from '../../services/atsService';
import resumeBuilderService from '../../services/resumeBuilderService';

// Common Components
import Badge from '../../components/common/Badge';

const BASELINE_KEYWORDS = [
  "Java", "Python", "Docker", "Kubernetes", "React", "AWS", "Git", "CI/CD", "Agile", "SQL"
];

export default function ATSReport() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumesLoading, setResumesLoading] = useState(false);

  // ATS Report States
  const [atsStatus, setAtsStatus] = useState('idle'); // idle, loading, analyzed, not_analyzed, failed
  const [reportData, setReportData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [atsError, setAtsError] = useState('');
  
  // Keyword Filters
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywordCategory, setKeywordCategory] = useState('ALL'); // ALL, DETECTED, MISSING
  
  // Suggestions Filters
  const [suggestionPriority, setSuggestionPriority] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  // Copied suggestion tracker
  const [copiedSuggestion, setCopiedSuggestion] = useState(null);

  // Plain Text Emulator States
  const [resumeData, setResumeData] = useState(null);
  const [showPlainTextEmulator, setShowPlainTextEmulator] = useState(false);

  // Circular gauge config
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

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
      const response = await atsService.getHistory();
      if (response.success) {
        setHistoryData(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load scoring history", err);
    }
  };

  useEffect(() => {
    fetchResumesList();
    fetchHistory();
  }, []);

  // Fetch report when selection changes
  useEffect(() => {
    if (!selectedResumeId) {
      setAtsStatus('idle');
      setReportData(null);
      return;
    }

    const loadReport = async () => {
      setAtsStatus('loading');
      setAtsError('');
      setResumeData(null);
      try {
        const response = await atsService.getReport(selectedResumeId);
        if (response.success) {
          setReportData(response.data);

          // Try to load resume JSON details for the Plain Text Emulator
          try {
            const builderResp = await resumeBuilderService.getResumeState(selectedResumeId);
            if (builderResp.success && builderResp.data) {
              setResumeData(JSON.parse(builderResp.data.resumeJson));
            }
          } catch (e) {
            console.error('Failed to load resume builder json state', e);
          }

          setAtsStatus('analyzed');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setAtsStatus('not_analyzed');
          setReportData(null);
        } else {
          setAtsError(err.response?.data?.message || 'Failed to retrieve ATS report.');
          setAtsStatus('failed');
          setReportData(null);
        }
      }
    };

    loadReport();
  }, [selectedResumeId]);

  // Process ATS Score Parameters

  const getPlainText = () => {
    if (!resumeData) return 'No parsed resume content available. Build your resume first!';
    
    let text = '';
    
    // Header
    if (resumeData.personalInfo) {
      const p = resumeData.personalInfo;
      text += `${(p.fullName || 'Candidate Name').toUpperCase()}\n`;
      text += `${p.email || ''} | ${p.phone || ''} | ${p.location || ''}\n`;
      if (p.linkedin) text += `LinkedIn: ${p.linkedin}\n`;
      text += `\n=========================================\n\n`;
      if (p.professionalSummary) {
        text += `PROFESSIONAL SUMMARY\n`;
        text += `${p.professionalSummary}\n\n`;
      }
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      text += `EDUCATION\n`;
      resumeData.education.forEach(edu => {
        text += `- ${edu.college || ''}\n`;
        text += `  ${edu.degree || ''} in ${edu.branch || ''} (${edu.startYear || ''} - ${edu.endYear || ''})\n`;
      });
      text += `\n`;
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      text += `WORK EXPERIENCE\n`;
      resumeData.experience.forEach(exp => {
        text += `- ${exp.role || ''} at ${exp.company || ''} (${exp.duration || ''})\n`;
        if (exp.responsibilities && exp.responsibilities.length > 0) {
          exp.responsibilities.forEach(bullet => {
            text += `  * ${bullet}\n`;
          });
        }
      });
      text += `\n`;
    }
    
    // Skills
    if (resumeData.skills) {
      text += `TECHNICAL SKILLS\n`;
      Object.entries({
        'Languages': resumeData.skills.programmingLanguages,
        'Frameworks': resumeData.skills.frameworks,
        'Databases': resumeData.skills.databases,
        'Cloud / DevOps': resumeData.skills.cloud,
        'Tools': resumeData.skills.tools,
      }).forEach(([label, list]) => {
        if (list && list.length > 0) {
          text += `- ${label}: ${list.join(', ')}\n`;
        }
      });
      text += `\n`;
    }

    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      text += `KEY PROJECTS\n`;
      resumeData.projects.forEach(proj => {
        text += `- ${proj.projectName || ''} (${proj.duration || ''})\n`;
        text += `  ${proj.description || ''}\n`;
        if (proj.githubLink) text += `  GitHub: ${proj.githubLink}\n`;
      });
      text += `\n`;
    }

    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      text += `ACHIEVEMENTS\n`;
      resumeData.achievements.forEach(ach => {
        text += `- ${ach}\n`;
      });
      text += `\n`;
    }

    // Languages
    if (resumeData.languages && resumeData.languages.length > 0) {
      text += `LANGUAGES\n`;
      text += `- ${resumeData.languages.join(', ')}\n`;
    }
    
    return text;
  };

  // Run ATS analysis
  const handleAnalyze = async () => {
    if (!selectedResumeId) return;

    setAtsStatus('loading');
    setAtsError('');

    try {
      const response = await atsService.analyzeResume(selectedResumeId);
      if (response.success) {
        setReportData(response.data);
        setAtsStatus('analyzed');
        fetchHistory(); // Refresh history timeline
        showToast('success', 'ATS scoring analysis complete!');
      } else {
        throw new Error(response.message || 'Scoring failed');
      }
    } catch (err) {
      setAtsError(err.response?.data?.message || 'Please parse the resume under "Resume Analysis" first before running ATS evaluation.');
      setAtsStatus('failed');
      showToast('error', 'Failed to generate ATS score.');
    }
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
    if (score >= 80) return 'Strong Match';
    if (score >= 60) return 'Good Match';
    return 'Requires Optimization';
  };

  // Printable and export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ats_report_${selectedResumeId.substring(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('success', 'JSON report exported.');
  };

  const getActiveResumeTitle = () => {
    const active = resumes.find((r) => r.id === selectedResumeId);
    return active ? active.resumeTitle : 'Resume';
  };

  // Recharts parsed data mapping
  const getRadarData = () => {
    if (!reportData || !reportData.scoreBreakdown) return [];
    const b = reportData.scoreBreakdown;
    return [
      { subject: 'Formatting', A: b.formatting, fullMark: 100 },
      { subject: 'Education', A: b.education, fullMark: 100 },
      { subject: 'Experience', A: b.experience, fullMark: 100 },
      { subject: 'Projects', A: b.projects, fullMark: 100 },
      { subject: 'Skills', A: b.skills, fullMark: 100 },
      { subject: 'Keywords', A: b.keywords, fullMark: 100 },
      { subject: 'Structure', A: b.structure, fullMark: 100 },
    ];
  };

  const getBarData = () => {
    if (!reportData || !reportData.scoreBreakdown) return [];
    const b = reportData.scoreBreakdown;
    return [
      { name: 'Formatting', Score: b.formatting },
      { name: 'Education', Score: b.education },
      { name: 'Experience', Score: b.experience },
      { name: 'Projects', Score: b.projects },
      { name: 'Skills', Score: b.skills },
      { name: 'Keywords', Score: b.keywords },
      { name: 'Readability', Score: b.readability },
    ];
  };

  const getPieData = () => {
    if (!reportData || !reportData.keywordAnalysis) return [];
    const det = reportData.keywordAnalysis.detectedKeywords?.length || 0;
    const miss = reportData.keywordAnalysis.missingKeywords?.length || 0;
    return [
      { name: 'Detected', value: det },
      { name: 'Missing', value: miss },
    ];
  };

  // Timeline chronology data
  const getTimelineData = () => {
    return [...historyData]
      .reverse() // chronological order
      .map((h) => ({
        date: new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Score: h.overallScore,
        Title: h.resumeTitle,
      }));
  };

  // Filters keywords
  const getFilteredKeywords = () => {
    if (!reportData || !reportData.keywordAnalysis) return [];
    const analysis = reportData.keywordAnalysis;

    let items = [];
    if (keywordCategory === 'ALL' || keywordCategory === 'DETECTED') {
      analysis.detectedKeywords?.forEach((k) => items.push({ type: 'DETECTED', value: k }));
    }
    if (keywordCategory === 'ALL' || keywordCategory === 'MISSING') {
      analysis.missingKeywords?.forEach((k) => items.push({ type: 'MISSING', value: k }));
      analysis.suggestedKeywords?.forEach((k) => {
        if (!items.some((i) => i.value === k)) {
          items.push({ type: 'SUGGESTED', value: k });
        }
      });
    }

    return items.filter((item) =>
      item.value.toLowerCase().includes(keywordQuery.toLowerCase())
    );
  };

  // Filter suggestions
  const getFilteredSuggestions = () => {
    if (!reportData || !reportData.suggestions) return [];
    return reportData.suggestions.filter((s) => {
      const matchesPriority = suggestionPriority === 'ALL' || s.priority === suggestionPriority;
      return matchesPriority;
    });
  };

  return (
    <div className="page-atsreport flex flex-col gap-8 pb-16">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-slate-100 text-left text-2xl font-extrabold tracking-tight m-0">
            ATS Score Analysis
          </h1>
          <p className="text-left text-slate-500 text-xs mt-1">
            Deterministic rule-based scoring engine for resume validation.
          </p>
        </div>

        {/* Global Toolbar controls */}
        {atsStatus === 'analyzed' && reportData && (
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
              onClick={handleAnalyze}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Re-evaluate ATS
            </button>
          </div>
        )}
      </div>

      {/* Grid container */}
      <div className="ats-grid-layout">
        {/* Left selector sidebar */}
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
              No resumes uploaded yet. Go to Resume Manager to upload files.
            </div>
          )}
        </div>

        {/* Content pane */}
        <div className="flex-1 min-w-0 space-y-8">
          <AnimatePresence mode="wait">
            {/* 1. Loading state */}
            {atsStatus === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-16 bg-slate-900/20 border border-slate-850 rounded-3xl"
              >
                <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
                  <ClipboardList className="text-indigo-400 animate-pulse" size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">Analyzing ATS Criteria</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-2">
                  Calculating completeness, readability, keyword match ratios, and formatting rules...
                </p>
              </motion.div>
            )}

            {/* 2. Not Evaluated State */}
            {atsStatus === 'not_analyzed' && (
              <motion.div
                key="not_analyzed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-16 bg-slate-900/20 border border-slate-850 rounded-3xl text-center"
              >
                <div className="w-16 h-16 bg-slate-900 text-indigo-400 border border-slate-850 rounded-2xl flex items-center justify-center mb-5">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">Ready to Score</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                  Analyze the resume "{getActiveResumeTitle()}" using rule-based metrics to identify optimization gaps and structural metrics.
                </p>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Play size={12} className="fill-white" /> Evaluate ATS Score
                </button>
              </motion.div>
            )}

            {/* 3. Failed State */}
            {atsStatus === 'failed' && (
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
                <h3 className="text-base font-bold text-red-400 mb-2">Analysis Blocked</h3>
                <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
                  {atsError}
                </p>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} /> Retry Analysis
                </button>
              </motion.div>
            )}

            {/* 4. Analyzed Content */}
            {atsStatus === 'analyzed' && reportData && (
              <motion.div
                key="analyzed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8 text-left"
              >
                {/* Emulator View Toggle Toolbar */}
                <div className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Parser Emulator</h3>
                    <p className="text-[10px] text-slate-500">Toggle between structured graphical insights and plain text layout read by legacy parsers</p>
                  </div>
                  <button
                    onClick={() => setShowPlainTextEmulator(!showPlainTextEmulator)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                      showPlainTextEmulator
                        ? 'bg-indigo-950/30 border-indigo-550 text-indigo-400'
                        : 'bg-slate-950 border-slate-850 text-slate-455 hover:text-slate-205'
                    }`}
                  >
                    <FileText size={12} />
                    {showPlainTextEmulator ? 'Show Visual Insights' : 'Emulator: Plain Text View'}
                  </button>
                </div>

                {showPlainTextEmulator ? (
                  /* Monospaced Emulator view block */
                  <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ATS Database Reader Simulator (Monospaced Text Output)</span>
                      <span className="text-[8px] bg-red-950/20 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-full font-bold uppercase">Formatting Stripped</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-350 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto bg-transparent border-none p-0 text-left">
                      {getPlainText()}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* --- Section A: Circular score gauge --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  <div className="gauge-container col-span-1">
                    <svg width="120" height="120" className="gauge-circle">
                      <circle cx="60" cy="60" r={radius} className="gauge-bg" />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className={`gauge-fill ${
                          reportData.overallScore >= 80
                            ? 'stroke-emerald-500'
                            : reportData.overallScore >= 60
                            ? 'stroke-amber-500'
                            : 'stroke-rose-500'
                        }`}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (reportData.overallScore / 100) * circumference}
                      />
                      <text x="60" y="55" className="gauge-text">
                        {reportData.overallScore}
                      </text>
                      <text x="60" y="80" className="gauge-label">
                        SCORE
                      </text>
                    </svg>
                    <div className="mt-4 text-center">
                      <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${getScoreBgClass(reportData.overallScore)} ${getScoreColorClass(reportData.overallScore)}`}>
                        {getScoreStatusText(reportData.overallScore)}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between text-left">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className="text-indigo-400 animate-pulse" /> ATS Match Summary
                      </h3>
                      <p className="text-xs text-slate-450 leading-relaxed mb-4">
                        Your resume scoring evaluates formatting, structural elements, and skills density. Modern tracking tools filter templates lacking contact tags, structured lists, or quantified accomplishments.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Priority Tasks</span>
                        <span className="text-sm font-extrabold text-slate-200">
                          {reportData.suggestions?.filter((s) => s.priority === 'HIGH').length || 0} Critical
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Keyword Coverage</span>
                        <span className="text-sm font-extrabold text-slate-200">
                          {reportData.keywordAnalysis?.detectedKeywords?.length || 0} / {BASELINE_KEYWORDS.length} Matched
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Section B: Breakdown grid progress bars --- */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest text-left">
                    Section Breakdown Scorecards
                  </h3>
                  <div className="breakdown-grid">
                    {Object.entries({
                      'Formatting': reportData.scoreBreakdown?.formatting,
                      'Education': reportData.scoreBreakdown?.education,
                      'Experience': reportData.scoreBreakdown?.experience,
                      'Projects': reportData.scoreBreakdown?.projects,
                      'Skills': reportData.scoreBreakdown?.skills,
                      'Keywords': reportData.scoreBreakdown?.keywords,
                      'Achievements': reportData.scoreBreakdown?.achievements,
                      'Readability': reportData.scoreBreakdown?.readability,
                      'Structure': reportData.scoreBreakdown?.structure,
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

                {/* --- Section C: Charts visual graphs --- */}
                <div className="charts-grid print-hide">
                  {/* Radar Chart */}
                  <div className="chart-card">
                    <h3 className="chart-title">Match Radar Analysis</h3>
                    <div className="w-full h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                          <PolarRadiusAxis stroke="#1e293b" angle={30} domain={[0, 100]} />
                          <Radar name="Scoring Profile" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="chart-card">
                    <h3 className="chart-title">Section Score Ratios</h3>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getBarData()} layout="vertical" margin={{ left: -10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#64748b" domain={[0, 100]} fontSize={10} />
                          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }} />
                          <Bar dataKey="Score" fill="#6366f1" radius={[0, 4, 4, 0]}>
                            {getBarData().map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.Score >= 80
                                    ? '#10b981'
                                    : entry.Score >= 60
                                    ? '#f59e0b'
                                    : '#ef4444'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Keyword Matching Pie Chart */}
                  <div className="chart-card">
                    <h3 className="chart-title">Keywords Match Rate</h3>
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

                  {/* Score Timeline Line Chart */}
                  {historyData.length > 1 && (
                    <div className="chart-card">
                      <h3 className="chart-title">Evaluation Timeline</h3>
                      <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getTimelineData()} margin={{ left: -10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" domain={[0, 100]} fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }} />
                            <Line type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Section D: Keywords taxonomy filters --- */}
                <div className="space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                      Industry Keywords Matrix
                    </h3>
                    {/* Search keywords */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl min-w-[200px]">
                      <Search size={14} className="text-slate-500 shrink-0" />
                      <input
                        type="text"
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                        placeholder="Search keywords..."
                        className="bg-transparent border-none text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl w-fit">
                    {['ALL', 'DETECTED', 'MISSING'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setKeywordCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          keywordCategory === cat
                            ? 'bg-slate-800 text-slate-200'
                            : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 bg-slate-950/20 border border-slate-850/50 p-4 rounded-2xl min-h-[60px]">
                    {getFilteredKeywords().length > 0 ? (
                      getFilteredKeywords().map((kw, index) => (
                        <span
                          key={index}
                          className={`text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                            kw.type === 'DETECTED'
                              ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400'
                              : 'bg-rose-950/30 border-rose-900/30 text-rose-450'
                          }`}
                        >
                          <Circle size={5} className="fill-current shrink-0" /> {kw.value}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600 font-semibold italic">
                        No keywords match the filters query.
                      </span>
                    )}
                  </div>
                </div>

                {/* --- Section E: Suggestions List --- */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest text-left">
                      Improvement Action Suggestions
                    </h3>
                    <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl w-fit">
                      {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((prio) => (
                        <button
                          key={prio}
                          onClick={() => setSuggestionPriority(prio)}
                          className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            suggestionPriority === prio
                              ? 'bg-slate-800 text-slate-200'
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          {prio} Suggestions
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getFilteredSuggestions().length > 0 ? (
                      getFilteredSuggestions().map((s, index) => (
                        <div key={index} className="suggestion-item-row group/sug">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {s.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                              <AlertCircle size={16} className="text-slate-500 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-200 font-semibold mb-1">{s.message}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">
                                  {s.section}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(s.message);
                                setCopiedSuggestion(`sug-${index}`);
                                setTimeout(() => setCopiedSuggestion(null), 2000);
                              }}
                              className="opacity-0 group-hover/sug:opacity-100 p-1 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer"
                              title="Copy suggestion"
                            >
                              {copiedSuggestion === `sug-${index}` ? <ClipboardCheck size={12} /> : <Copy size={12} />}
                            </button>
                            <Badge variant={s.priority === 'HIGH' ? 'danger' : s.priority === 'MEDIUM' ? 'warning' : 'info'}>
                              {s.priority}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="suggestion-item-row justify-center py-6 text-slate-500 text-xs italic">
                        No pending suggestions matching criteria.
                      </div>
                    )}
                  </div>
                </div>
                  </div>
                )}
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
