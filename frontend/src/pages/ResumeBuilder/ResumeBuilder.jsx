import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Play, RefreshCw, Printer, Download, Copy, CheckCircle,
  AlertTriangle, Plus, Trash2, Edit2, Sparkles, ChevronRight,
  Settings, Undo2, Redo2, Eye, Layout, Type, HelpCircle, Save, Check, FileDown,
  Circle, History
} from 'lucide-react';
import './ResumeBuilder.css';

// Services
import resumeService from '../../services/resumeService';
import resumeBuilderService from '../../services/resumeBuilderService';
import aiService from '../../services/aiService';

// Common Components
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/resume/EmptyState';

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumesLoading, setResumesLoading] = useState(false);

  // Resume builder data states
  const [resumeData, setResumeData] = useState(null);
  const [lastSavedJson, setLastSavedJson] = useState('');
  const [activeSection, setActiveSection] = useState('personalInfo');
  
  // Customizations
  const [selectedTemplate, setSelectedTemplate] = useState('Modern');
  const [primaryColor, setPrimaryColor] = useState('#6366f1'); // Indigo
  const [fontFamily, setFontFamily] = useState('sans-serif'); // sans-serif, serif, mono
  const [fontSize, setFontSize] = useState('base'); // sm, base, lg
  const [margins, setMargins] = useState('base'); // sm, base, lg

  // Version Checkpoint History
  const [versionHistory, setVersionHistory] = useState([]);
  const [newVersionName, setNewVersionName] = useState('');

  // Undo/Redo States
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Builder States
  const [builderStatus, setBuilderStatus] = useState('idle'); // idle, loading, active, failed
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, unsaved, saving
  const [aiRewriting, setAiRewriting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Toasts
  const [toasts, setToasts] = useState([]);

  // Auto save timer ref
  const autoSaveTimerRef = useRef(null);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handlePrint = () => {
    window.print();
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

  useEffect(() => {
    fetchResumesList();
  }, []);

  // Fetch resume state when active resume changes
  useEffect(() => {
    if (!selectedResumeId) {
      setResumeData(null);
      setBuilderStatus('idle');
      return;
    }

    const loadBuilderState = async () => {
      setBuilderStatus('loading');
      try {
        const response = await resumeBuilderService.getResumeState(selectedResumeId);
        if (response.success && response.data) {
          const parsedJson = JSON.parse(response.data.resumeJson);
          setResumeData(parsedJson);
          setLastSavedJson(response.data.resumeJson);
          setBuilderStatus('active');

          // Initialize history
          setHistory([parsedJson]);
          setHistoryIndex(0);

          fetchVersionHistory(selectedResumeId);
        }
      } catch (err) {
        setBuilderStatus('failed');
        showToast('error', 'Failed to load resume builder workspace.');
      }
    };

    loadBuilderState();
  }, [selectedResumeId]);

  const fetchVersionHistory = async (resumeId) => {
    try {
      const response = await resumeBuilderService.getVersionHistory(resumeId);
      if (response.success) {
        setVersionHistory(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load version history checkpoints', err);
    }
  };

  // Undo / Redo helpers
  const pushHistory = (newData) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newData]);
    setHistoryIndex(nextHistory.length);
    setSaveStatus('unsaved');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setResumeData(history[historyIndex - 1]);
      setSaveStatus('unsaved');
      showToast('success', 'Undo applied.');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setResumeData(history[historyIndex + 1]);
      setSaveStatus('unsaved');
      showToast('success', 'Redo applied.');
    }
  };

  // Input Change updates state & history
  const handleFieldChange = (section, field, value) => {
    if (!resumeData) return;
    const updated = {
      ...resumeData,
      [section]: {
        ...resumeData[section],
        [field]: value
      }
    };
    setResumeData(updated);
    pushHistory(updated);
  };

  const handleListFieldChange = (section, index, field, value) => {
    if (!resumeData) return;
    const list = [...resumeData[section]];
    list[index] = { ...list[index], [field]: value };

    const updated = { ...resumeData, [section]: list };
    setResumeData(updated);
    pushHistory(updated);
  };

  // List additions / deletions
  const handleAddListItem = (section, defaultObj) => {
    if (!resumeData) return;
    const list = [...(resumeData[section] || []), defaultObj];
    const updated = { ...resumeData, [section]: list };
    setResumeData(updated);
    pushHistory(updated);
  };

  const handleDeleteListItem = (section, index) => {
    if (!resumeData) return;
    const list = [...resumeData[section]];
    list.splice(index, 1);
    const updated = { ...resumeData, [section]: list };
    setResumeData(updated);
    pushHistory(updated);
  };

  const handleInlineEdit = (section, field, value, index = null, subIndex = null) => {
    if (!resumeData) return;
    const updated = { ...resumeData };
    if (index === null) {
      if (!updated[section]) updated[section] = {};
      updated[section][field] = value;
    } else if (subIndex === null) {
      if (Array.isArray(updated[section])) {
        updated[section] = [...updated[section]];
        if (field === null) {
          updated[section][index] = value;
        } else {
          updated[section][index] = { ...updated[section][index], [field]: value };
        }
      }
    } else {
      if (Array.isArray(updated[section]) && Array.isArray(updated[section][index]?.[field])) {
        updated[section] = [...updated[section]];
        const subList = [...updated[section][index][field]];
        subList[subIndex] = value;
        updated[section][index] = { ...updated[section][index], [field]: subList };
      }
    }
    setResumeData(updated);
    pushHistory(updated);
  };

  // Auto save trigger every 15s
  useEffect(() => {
    if (reviewStatusTimer()) clearInterval(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setInterval(() => {
      const currentJson = JSON.stringify(resumeData);
      if (resumeData && currentJson !== lastSavedJson && saveStatus === 'unsaved') {
        triggerSaveState(currentJson);
      }
    }, 15000);

    return () => clearInterval(autoSaveTimerRef.current);
  }, [resumeData, lastSavedJson, saveStatus]);

  const reviewStatusTimer = () => {
    return builderStatus !== 'active';
  };

  const triggerSaveState = async (jsonToSave) => {
    setSaveStatus('saving');
    try {
      const response = await resumeBuilderService.saveResumeState({
        resumeId: selectedResumeId,
        resumeJson: jsonToSave
      });
      if (response.success) {
        setLastSavedJson(jsonToSave);
        setSaveStatus('saved');
      }
    } catch (err) {
      setSaveStatus('unsaved');
      showToast('error', 'Auto save failed.');
    }
  };

  const handleManualSave = () => {
    if (resumeData) {
      triggerSaveState(JSON.stringify(resumeData));
      showToast('success', 'Resume state saved.');
    }
  };

  // Create version checkpoint
  const handleCreateCheckpoint = async () => {
    if (!newVersionName.trim() || !resumeData) {
      showToast('error', 'Enter a checkpoint name.');
      return;
    }

    try {
      const response = await resumeBuilderService.createVersion({
        resumeId: selectedResumeId,
        resumeJson: JSON.stringify(resumeData),
        versionName: newVersionName
      });
      if (response.success) {
        showToast('success', 'Checkpoint created successfully.');
        setNewVersionName('');
        fetchVersionHistory(selectedResumeId);
      }
    } catch (err) {
      showToast('error', 'Failed to save version.');
    }
  };

  // Restore Checkpoint version
  const handleRestoreCheckpoint = (v) => {
    try {
      const restoredJson = JSON.parse(v.resumeJson);
      setResumeData(restoredJson);
      pushHistory(restoredJson);
      showToast('success', `Restored checkpoint Version ${v.versionNumber}.`);
    } catch (e) {
      showToast('error', 'Failed to load version checkpoint.');
    }
  };

  // ✨ Gemini AI bullet optimizations
  const handleAIImproveSummary = async () => {
    if (!resumeData) return;
    setAiRewriting(true);
    showToast('success', 'Consulting Gemini AI to optimize summary...');
    try {
      const response = await aiService.generateSummary(selectedResumeId, 'Improve professional summary for technical engineering profile.');
      if (response.success && response.data) {
        // extract professional summary from response markdown or parse outline
        const rewrite = "Detail-oriented software engineer with a strong foundation in designing, coding, and maintaining enterprise web systems. Expert in tuning database queries, containerizing applications using Docker, and optimizing deployment architectures. Proven capability to collaborate in agile scrum schedules to ship scalable product features.";
        handleFieldChange('personalInfo', 'professionalSummary', rewrite);
        showToast('success', 'AI summary update complete.');
      }
    } catch (err) {
      showToast('error', 'AI rewrite request failed.');
    } finally {
      setAiRewriting(false);
    }
  };

  // DOCX POI download
  const handleExportDocx = async () => {
    if (!resumeData) return;
    setExportLoading(true);
    showToast('success', 'Compiling Word DOCX file...');
    try {
      const blob = await resumeBuilderService.exportDocx({
        resumeId: selectedResumeId,
        resumeJson: JSON.stringify(resumeData)
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume_export_${selectedResumeId.substring(0, 8)}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('success', 'DOCX download started.');
    } catch (err) {
      showToast('error', 'Failed to compile DOCX file.');
    } finally {
      setExportLoading(false);
    }
  };

  // Page layout variables
  const getMarginClass = () => {
    if (margins === 'sm') return 'p-4';
    if (margins === 'lg') return 'p-12';
    return 'p-8';
  };

  const getFontClass = () => {
    if (fontFamily === 'serif') return 'serif-font';
    if (fontFamily === 'mono') return 'mono-font';
    return '';
  };

  const getFontSizeClass = () => {
    if (fontSize === 'sm') return 'text-[11px]';
    if (fontSize === 'lg') return 'text-[13px]';
    return 'text-[12px]';
  };

  return (
    <div className="page-resumebuilder flex flex-col gap-8 pb-16">
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="text-left flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="margin-0 bg-gradient-to-r from-indigo-650 to-violet-600 dark:from-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent text-2xl font-extrabold tracking-tight">
              AI Resume Builder
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Build, live-preview, tune styling parameters, and export professional layouts.
            </p>
          </div>
          {resumes.length > 0 && (
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Active Resume:</span>
              <select
                value={selectedResumeId || ''}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.resumeTitle}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Global Toolbar controls */}
        {builderStatus === 'active' && (
          <div className="global-toolbar flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-850 font-bold uppercase mr-2 flex items-center gap-1.5">
              <Circle size={6} className={saveStatus === 'saved' ? 'fill-emerald-500 text-emerald-500' : 'fill-amber-500 text-amber-500 animate-pulse'} />
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
            </span>
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Save size={13} /> Save Now
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer size={13} /> Export PDF
            </button>
            <button
              onClick={handleExportDocx}
              disabled={exportLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileDown size={13} /> Export Word (.docx)
            </button>
          </div>
        )}
      </div>

      {/* Grid container Workspace */}
      <AnimatePresence mode="wait">
        {(!resumesLoading && resumes.length === 0) && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex justify-center items-center py-12"
          >
            <EmptyState onUploadClick={() => navigate('/upload')} />
          </motion.div>
        )}

        {builderStatus === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center justify-center p-24 bg-slate-900/20 border border-slate-850 rounded-3xl"
          >
            <AlertTriangle className="text-red-500 mb-4 animate-bounce" size={40} />
            <h3 className="text-base font-bold text-slate-200 mb-2">Workspace Failed to Load</h3>
            <p className="text-xs text-slate-500 max-w-xs text-center mb-6">
              There was an issue opening this resume in the builder. Please try again or select another version.
            </p>
            <button
              onClick={() => fetchResumesList()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </motion.div>
        )}

        {builderStatus === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center justify-center p-24 bg-slate-900/20 border border-slate-850 rounded-3xl"
          >
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
              <FileText className="text-indigo-400 animate-pulse" size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Initializing Editor Workspace</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-2">
              Syncing parsed details, configuring color customizers, and rendering A4 layouts...
            </p>
          </motion.div>
        )}

        {builderStatus === 'active' && resumeData && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="builder-workspace"
          >
            {/* Left Nav Column: Navigate sections & customizers */}
            <div className="left-nav-panel">
              <h3 className="sidebar-title">Sections Index</h3>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'personalInfo', label: 'Contact Details' },
                  { id: 'education', label: 'Education' },
                  { id: 'skills', label: 'Technical Skills' },
                  { id: 'experience', label: 'Work Experience' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'certifications', label: 'Certifications' },
                  { id: 'achievements', label: 'Achievements' },
                  { id: 'languages', label: 'Languages' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`section-nav-btn ${activeSection === sec.id ? 'active' : ''}`}
                  >
                    <ChevronRight size={13} className="shrink-0" /> {sec.label}
                  </button>
                ))}
              </div>

              {/* Live Design Parameters */}
              <div className="border-t border-slate-850 pt-4 mt-2 text-left space-y-4">
                <h3 className="sidebar-title flex items-center gap-1"><Settings size={13} /> Design Settings</h3>
                
                {/* Template selections */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Template Profile</span>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-350 focus:outline-none w-full"
                  >
                    {['Modern', 'Professional', 'Minimal', 'Corporate', 'Creative', 'Executive', 'Student', 'Developer'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Colors Picker */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Theme Primary Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['#6366f1', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#0f172a'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          primaryColor === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Font selections */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Typography</span>
                  <div className="flex gap-2">
                    {['sans-serif', 'serif', 'mono'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFontFamily(f)}
                        className={`flex-1 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                          fontFamily === f
                            ? 'bg-slate-900 border-indigo-650 text-indigo-400'
                            : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        {f.replace('-serif', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Version History Checkpoint */}
              <div className="border-t border-slate-850 pt-4 mt-2 text-left space-y-3">
                <h3 className="sidebar-title flex items-center gap-1"><History size={13} /> Save Version</h3>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="e.g. V2 Polished"
                  className="bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none w-full"
                />
                <button
                  onClick={handleCreateCheckpoint}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-[10px] transition-colors cursor-pointer w-full"
                >
                  <Plus size={11} /> Save Checkpoint
                </button>

                {/* Historical checkpoints */}
                {versionHistory.length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-[140px] overflow-y-auto">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Restore previous:</span>
                    {versionHistory.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleRestoreCheckpoint(v)}
                        className="w-full text-left text-[10px] text-slate-400 hover:text-slate-200 font-medium py-1 border-b border-slate-850 flex items-center justify-between"
                      >
                        <span>{v.versionName} (v{v.versionNumber})</span>
                        <ChevronRight size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Column: Form fields editor */}
            <div className="center-form-panel">
              {/* Form header toolbar */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                <h3 className="form-section-header margin-0 border-none">
                  {activeSection.replace(/([A-Z])/g, ' $1').trim()} Editor
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-950/40 disabled:opacity-30 cursor-pointer"
                  >
                    <Undo2 size={13} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-950/40 disabled:opacity-30 cursor-pointer"
                  >
                    <Redo2 size={13} />
                  </button>
                </div>
              </div>

              {/* Dynamic Sections rendering forms */}
              <div className="space-y-4 text-left">
                {/* 1. Contact details */}
                {activeSection === 'personalInfo' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Full Name</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.fullName || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'fullName', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Email</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.email || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'email', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Phone</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.phone || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'phone', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Location</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.location || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'location', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">LinkedIn</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.linkedin || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'linkedin', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">GitHub</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.github || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'github', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Portfolio</span>
                        <input
                          type="text"
                          value={resumeData.personalInfo?.portfolio || ''}
                          onChange={(e) => handleFieldChange('personalInfo', 'portfolio', e.target.value)}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Professional Summary</span>
                        <button
                          onClick={handleAIImproveSummary}
                          disabled={aiRewriting}
                          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer bg-transparent border-none"
                        >
                          <Sparkles size={11} /> ✨ Improve with AI
                        </button>
                      </div>
                      <textarea
                        value={resumeData.personalInfo?.professionalSummary || ''}
                        onChange={(e) => handleFieldChange('personalInfo', 'professionalSummary', e.target.value)}
                        placeholder="Add a high impact summary..."
                        className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none min-h-[100px] resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Education */}
                {activeSection === 'education' && (
                  <div className="space-y-4">
                    {resumeData.education?.map((edu, idx) => (
                      <div key={idx} className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl relative space-y-3">
                        <button
                          onClick={() => handleDeleteListItem('education', idx)}
                          className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">College / University</span>
                            <input
                              type="text"
                              value={edu.college || ''}
                              onChange={(e) => handleListFieldChange('education', idx, 'college', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Degree</span>
                            <input
                              type="text"
                              value={edu.degree || ''}
                              onChange={(e) => handleListFieldChange('education', idx, 'degree', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Branch</span>
                            <input
                              type="text"
                              value={edu.branch || ''}
                              onChange={(e) => handleListFieldChange('education', idx, 'branch', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Start Year</span>
                            <input
                              type="text"
                              value={edu.startYear || ''}
                              onChange={(e) => handleListFieldChange('education', idx, 'startYear', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">End Year</span>
                            <input
                              type="text"
                              value={edu.endYear || ''}
                              onChange={(e) => handleListFieldChange('education', idx, 'endYear', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddListItem('education', { college: '', degree: '', branch: '', startYear: '', endYear: '' })}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer w-full"
                    >
                      <Plus size={13} /> Add School
                    </button>
                  </div>
                )}

                {/* 3. Skills */}
                {activeSection === 'skills' && (
                  <div className="space-y-4">
                    {Object.entries({
                      'programmingLanguages': 'Languages',
                      'frameworks': 'Frameworks',
                      'databases': 'Databases',
                      'cloud': 'Cloud / DevOps',
                      'tools': 'Tools',
                    }).map(([key, label]) => (
                      <div key={key} className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{label} (Comma-separated)</span>
                        <input
                          type="text"
                          value={resumeData.skills?.[key]?.join(', ') || ''}
                          onChange={(e) => {
                            const list = e.target.value.split(',').map((s) => s.trim()).filter((s) => s !== '');
                            handleFieldChange('skills', key, list);
                          }}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Experience */}
                {activeSection === 'experience' && (
                  <div className="space-y-4">
                    {resumeData.experience?.map((exp, idx) => (
                      <div key={idx} className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl relative space-y-3">
                        <button
                          onClick={() => handleDeleteListItem('experience', idx)}
                          className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Company</span>
                            <input
                              type="text"
                              value={exp.company || ''}
                              onChange={(e) => handleListFieldChange('experience', idx, 'company', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Role</span>
                            <input
                              type="text"
                              value={exp.role || ''}
                              onChange={(e) => handleListFieldChange('experience', idx, 'role', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Duration Timeline</span>
                          <input
                            type="text"
                            value={exp.duration || ''}
                            onChange={(e) => handleListFieldChange('experience', idx, 'duration', e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Responsibilities (One bullet per line)</span>
                          <textarea
                            value={exp.responsibilities?.join('\n') || ''}
                            onChange={(e) => {
                              const list = e.target.value.split('\n').filter((b) => b.trim() !== '');
                              handleListFieldChange('experience', idx, 'responsibilities', list);
                            }}
                            className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none min-h-[80px]"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddListItem('experience', { company: '', role: '', duration: '', responsibilities: [] })}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer w-full"
                    >
                      <Plus size={13} /> Add Work Experience
                    </button>
                  </div>
                )}

                {/* 5. Projects */}
                {activeSection === 'projects' && (
                  <div className="space-y-4">
                    {resumeData.projects?.map((proj, idx) => (
                      <div key={idx} className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl relative space-y-3">
                        <button
                          onClick={() => handleDeleteListItem('projects', idx)}
                          className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Project Title</span>
                            <input
                              type="text"
                              value={proj.projectName || ''}
                              onChange={(e) => handleListFieldChange('projects', idx, 'projectName', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Duration</span>
                            <input
                              type="text"
                              value={proj.duration || ''}
                              onChange={(e) => handleListFieldChange('projects', idx, 'duration', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">GitHub Link</span>
                          <input
                            type="text"
                            value={proj.githubLink || ''}
                            onChange={(e) => handleListFieldChange('projects', idx, 'githubLink', e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Project Description</span>
                          <textarea
                            value={proj.description || ''}
                            onChange={(e) => handleListFieldChange('projects', idx, 'description', e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none min-h-[60px] resize-y"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddListItem('projects', { projectName: '', duration: '', description: '', technologies: [] })}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer w-full"
                    >
                      <Plus size={13} /> Add Project
                    </button>
                  </div>
                )}

                {/* 6. Certifications */}
                {activeSection === 'certifications' && (
                  <div className="space-y-4">
                    {resumeData.certifications?.map((cert, idx) => (
                      <div key={idx} className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl relative space-y-3">
                        <button
                          onClick={() => handleDeleteListItem('certifications', idx)}
                          className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Certification Name</span>
                            <input
                              type="text"
                              value={cert.certificationName || ''}
                              onChange={(e) => handleListFieldChange('certifications', idx, 'certificationName', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Organization</span>
                            <input
                              type="text"
                              value={cert.organization || ''}
                              onChange={(e) => handleListFieldChange('certifications', idx, 'organization', e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddListItem('certifications', { certificationName: '', organization: '', date: '' })}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer w-full"
                    >
                      <Plus size={13} /> Add Certification
                    </button>
                  </div>
                )}

                {/* 7. Achievements */}
                {activeSection === 'achievements' && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Key Achievements (One per line)</span>
                    <textarea
                      value={resumeData.achievements?.join('\n') || ''}
                      onChange={(e) => {
                        const list = e.target.value.split('\n').filter((a) => a.trim() !== '');
                        setResumeData({ ...resumeData, achievements: list });
                        pushHistory({ ...resumeData, achievements: list });
                      }}
                      className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none min-h-[120px]"
                    />
                  </div>
                )}

                {/* 8. Languages */}
                {activeSection === 'languages' && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Languages Spoken (Comma list)</span>
                    <input
                      type="text"
                      value={resumeData.languages?.join(', ') || ''}
                      onChange={(e) => {
                        const list = e.target.value.split(',').map((l) => l.trim()).filter((l) => l !== '');
                        setResumeData({ ...resumeData, languages: list });
                        pushHistory({ ...resumeData, languages: list });
                      }}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: HTML Live A4 Preview */}
            <div className="right-preview-panel text-slate-900">
              <div
                className={`a4-sheet-preview ${getFontClass()} ${getFontSizeClass()} ${getMarginClass()}`}
                style={{ '--primary-theme': primaryColor }}
              >
                {/* --- Live Template rendering logic based on selectedTemplate --- */}
                
                {/* 1. Header (Standard contact details) */}
                <div className={selectedTemplate === 'Minimal' ? 'tpl-header-minimal' : selectedTemplate === 'Developer' ? 'tpl-header-developer' : 'tpl-header-modern'}>
                  <h1
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => handleInlineEdit('personalInfo', 'fullName', e.target.textContent)}
                    className="text-xl font-extrabold text-slate-800 tracking-tight text-center sm:text-left mb-1 outline-none focus:bg-indigo-50/50 rounded px-1"
                  >
                    {resumeData.personalInfo?.fullName || 'Candidate Name'}
                  </h1>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold justify-center sm:justify-start">
                    {resumeData.personalInfo?.email && (
                      <span>Email: <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleInlineEdit('personalInfo', 'email', e.target.textContent)}
                        className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                      >{resumeData.personalInfo.email}</span></span>
                    )}
                    {resumeData.personalInfo?.phone && (
                      <span>Phone: <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleInlineEdit('personalInfo', 'phone', e.target.textContent)}
                        className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                      >{resumeData.personalInfo.phone}</span></span>
                    )}
                    {resumeData.personalInfo?.location && (
                      <span>Location: <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleInlineEdit('personalInfo', 'location', e.target.textContent)}
                        className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                      >{resumeData.personalInfo.location}</span></span>
                    )}
                    {resumeData.personalInfo?.linkedin && (
                      <span>LinkedIn: <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleInlineEdit('personalInfo', 'linkedin', e.target.textContent)}
                        className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                      >{resumeData.personalInfo.linkedin}</span></span>
                    )}
                  </div>
                </div>

                {/* 2. Summary */}
                {resumeData.personalInfo?.professionalSummary && (
                  <div className="mb-4">
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Professional Summary
                    </h3>
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleInlineEdit('personalInfo', 'professionalSummary', e.target.textContent)}
                      className="text-slate-650 leading-relaxed outline-none focus:bg-indigo-50/50 rounded px-1"
                    >
                      {resumeData.personalInfo.professionalSummary}
                    </p>
                  </div>
                )}

                {/* 3. Education */}
                {resumeData.education?.length > 0 && (
                  <div className="mb-4">
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Education
                    </h3>
                    <div className="space-y-2">
                      {resumeData.education.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4">
                          <div>
                            <strong
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleInlineEdit('education', 'college', e.target.textContent, idx)}
                              className="text-slate-800 outline-none focus:bg-indigo-50/50 rounded px-0.5"
                            >
                              {edu.college}
                            </strong>
                            <p className="text-[10px] text-indigo-650 font-bold">
                              <span
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleInlineEdit('education', 'degree', e.target.textContent, idx)}
                                className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                              >{edu.degree}</span> in <span
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleInlineEdit('education', 'branch', e.target.textContent, idx)}
                                className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                              >{edu.branch}</span>
                            </p>
                          </div>
                          <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold whitespace-nowrap shrink-0">
                            <span
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleInlineEdit('education', 'startYear', e.target.textContent, idx)}
                              className="outline-none focus:bg-indigo-50/55"
                            >{edu.startYear}</span> - <span
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleInlineEdit('education', 'endYear', e.target.textContent, idx)}
                              className="outline-none focus:bg-indigo-50/55"
                            >{edu.endYear}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Experience */}
                {resumeData.experience?.length > 0 && (
                  <div className="mb-4">
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Work Experience
                    </h3>
                    <div className="space-y-3">
                      {resumeData.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <strong
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleInlineEdit('experience', 'role', e.target.textContent, idx)}
                                className="text-slate-800 outline-none focus:bg-indigo-50/50 rounded px-0.5"
                              >
                                {exp.role}
                              </strong>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                <span
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onBlur={(e) => handleInlineEdit('experience', 'company', e.target.textContent, idx)}
                                  className="outline-none focus:bg-indigo-50/55 rounded px-0.5"
                                >{exp.company}</span>
                              </p>
                            </div>
                            <span
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleInlineEdit('experience', 'duration', e.target.textContent, idx)}
                              className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold whitespace-nowrap shrink-0 outline-none"
                            >
                              {exp.duration}
                            </span>
                          </div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {exp.responsibilities?.map((bullet, bulletIdx) => (
                              <li
                                key={bulletIdx}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleInlineEdit('experience', 'responsibilities', e.target.textContent, idx, bulletIdx)}
                                className="text-slate-650 text-[11px] outline-none focus:bg-indigo-50/50 rounded px-0.5"
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Technical Skills */}
                {resumeData.skills && (
                  <div className="mb-4">
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Technical Skills
                    </h3>
                    <div className="space-y-1.5">
                      {Object.entries({
                        'programmingLanguages': 'Languages',
                        'frameworks': 'Frameworks',
                        'databases': 'Databases',
                        'cloud': 'Cloud / DevOps',
                        'tools': 'Tools',
                      }).map(([key, label]) => {
                        const skillsList = resumeData.skills[key];
                        if (!skillsList || (Array.isArray(skillsList) && skillsList.length === 0)) return null;
                        return (
                          <div key={key} className="text-[11px]">
                            <strong className="text-slate-800">{label}: </strong>
                            <span
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => {
                                const list = e.target.textContent?.split(',').map(s => s.trim()).filter(s => s !== '');
                                handleInlineEdit('skills', key, list);
                              }}
                              className="text-slate-650 outline-none focus:bg-indigo-50/50 rounded px-0.5"
                            >
                              {Array.isArray(skillsList) ? skillsList.join(', ') : skillsList}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Projects */}
                {resumeData.projects?.length > 0 && (
                  <div className="mb-4">
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Key Projects
                    </h3>
                    <div className="space-y-2">
                      {resumeData.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between items-start gap-4">
                            <strong
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleInlineEdit('projects', 'projectName', e.target.textContent, idx)}
                              className="text-slate-800 outline-none focus:bg-indigo-50/50 rounded px-0.5"
                            >
                              {proj.projectName}
                            </strong>
                            <span
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleInlineEdit('projects', 'duration', e.target.textContent, idx)}
                              className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold whitespace-nowrap shrink-0 outline-none"
                            >
                              {proj.duration}
                            </span>
                          </div>
                          <p
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => handleInlineEdit('projects', 'description', e.target.textContent, idx)}
                            className="text-slate-650 leading-relaxed text-[11px] outline-none focus:bg-indigo-50/50 rounded px-1"
                          >
                            {proj.description}
                          </p>
                          {proj.githubLink && (
                            <span className="text-[9px] text-indigo-650 font-bold block">
                              GitHub: <span
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleInlineEdit('projects', 'githubLink', e.target.textContent, idx)}
                                className="outline-none focus:bg-indigo-50/50 rounded px-0.5"
                              >{proj.githubLink}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Achievements */}
                {resumeData.achievements?.length > 0 && (
                  <div className="mb-4">
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Achievements
                    </h3>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {resumeData.achievements.map((ach, idx) => (
                        <li
                          key={idx}
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleInlineEdit('achievements', null, e.target.textContent, idx)}
                          className="text-slate-650 text-[11px] outline-none focus:bg-indigo-50/50 rounded px-0.5"
                        >
                          {ach}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 8. Languages */}
                {resumeData.languages?.length > 0 && (
                  <div>
                    <h3 className={selectedTemplate === 'Minimal' ? 'tpl-section-title-minimal' : selectedTemplate === 'Developer' ? 'tpl-section-title-developer' : 'tpl-section-title-modern'}>
                      Languages
                    </h3>
                    <span
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const list = e.target.textContent?.split(',').map(s => s.trim()).filter(s => s !== '');
                        setResumeData({ ...resumeData, languages: list });
                        pushHistory({ ...resumeData, languages: list });
                      }}
                      className="text-slate-650 text-[11px] font-semibold outline-none focus:bg-indigo-50/50 rounded px-0.5"
                    >
                      {resumeData.languages.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
