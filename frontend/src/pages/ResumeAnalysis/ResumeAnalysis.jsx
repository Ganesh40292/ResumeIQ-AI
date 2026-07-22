import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronDown, ChevronRight, User, GraduationCap, Briefcase, Code,
  FolderGit, Award, Languages, Search, Copy, Download, RefreshCw, Play,
  CheckCircle, AlertCircle, Calendar, MapPin, Mail, Phone, ExternalLink, Globe,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import './ResumeAnalysis.css';

// Services
import resumeService from '../../services/resumeService';
import parserService from '../../services/parserService';

// Hooks
import useDebounce from '../../hooks/useDebounce';

// Common Components
import Badge from '../../components/common/Badge';

export default function ResumeAnalysis() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [resumesLoading, setResumesLoading] = useState(false);

  // Parsing States
  const [parsingStatus, setParsingStatus] = useState('idle'); // idle, loading, parsed, not_parsed, failed
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [parsingError, setParsingError] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Collapsible Sections
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    education: true,
    skills: true,
    experience: true,
    internships: true,
    projects: true,
    certifications: true,
    achievements: true,
    languages: true,
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Fetch Resumes list on mount
  const fetchResumesList = async () => {
    setResumesLoading(true);
    try {
      const response = await resumeService.getAllResumes();
      if (response.success) {
        const list = response.data || [];
        setResumes(list);
        if (list.length > 0) {
          // Auto select first resume
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

  // Fetch parsed data when selected resume changes
  useEffect(() => {
    if (!selectedResumeId) {
      setParsingStatus('idle');
      setParsedData(null);
      return;
    }

    const checkParsedState = async () => {
      setParsingStatus('loading');
      setParsingProgress(20);
      setParsingError('');
      try {
        const response = await parserService.getParsedResume(selectedResumeId);
        setParsingProgress(80);
        if (response.success) {
          setParsedData(response.data);
          setParsingStatus('parsed');
        }
      } catch (err) {
        // If 404, it means it hasn't been parsed yet
        if (err.response?.status === 404) {
          setParsingStatus('not_parsed');
          setParsedData(null);
        } else {
          setParsingError(err.response?.data?.message || 'Failed to retrieve parsed details.');
          setParsingStatus('failed');
          setParsedData(null);
        }
      } finally {
        setParsingProgress(100);
      }
    };

    checkParsedState();
  }, [selectedResumeId]);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Trigger parsing
  const handleParseResume = async () => {
    if (!selectedResumeId) return;

    setParsingStatus('loading');
    setParsingProgress(10);
    setParsingError('');

    // Simulate progress ticks
    const interval = setInterval(() => {
      setParsingProgress((p) => (p < 80 ? p + 10 : p));
    }, 300);

    try {
      const response = await parserService.parseResume(selectedResumeId);
      clearInterval(interval);
      setParsingProgress(100);

      if (response.success) {
        setParsedData(response.data);
        setParsingStatus('parsed');
        showToast('success', 'Resume parsed successfully!');
      } else {
        throw new Error(response.message || 'Parsing failed');
      }
    } catch (err) {
      clearInterval(interval);
      setParsingProgress(0);
      setParsingError(err.response?.data?.message || 'Failed to parse resume document.');
      setParsingStatus('failed');
      showToast('error', 'Failed to complete resume parsing.');
    }
  };

  // Toggle Collapse
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Copy to Clipboard
  const handleCopyJSON = () => {
    if (!parsedData) return;
    navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2))
      .then(() => showToast('success', 'Structured JSON copied to clipboard.'))
      .catch(() => showToast('error', 'Copy command failed.'));
  };

  // Export JSON file
  const handleExportJSON = () => {
    if (!parsedData) return;
    const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume_parsed_${selectedResumeId.substring(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('success', 'JSON exported successfully.');
  };

  // Filter content helper
  const filterMatches = (text) => {
    if (!debouncedSearch) return true;
    return text?.toLowerCase().includes(debouncedSearch.toLowerCase());
  };

  const filterListMatches = (list) => {
    if (!debouncedSearch) return true;
    return list?.some((item) => item?.toLowerCase().includes(debouncedSearch.toLowerCase()));
  };

  const getActiveResumeName = () => {
    const active = resumes.find((r) => r.id === selectedResumeId);
    return active ? active.resumeTitle : 'Resume';
  };

  return (
    <div className="page-resumeanalysis flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-100 text-left text-2xl font-extrabold tracking-tight m-0">
            Resume Analysis
          </h1>
          <p className="text-left text-slate-500 text-xs mt-1">
            Extract, inspect, and copy parsed details from your uploads.
          </p>
        </div>

        {/* Global Toolbar */}
        {parsingStatus === 'parsed' && parsedData && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Copy size={13} /> Copy JSON
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download size={13} /> Export JSON
            </button>
            <button
              onClick={handleParseResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Parsing
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="analysis-container">
        {/* Sidebar Selector */}
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
              No resumes uploaded yet. Go to Upload Resume to add files.
            </div>
          )}
        </div>

        {/* Parsing Content Display */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* 1. Loading State */}
            {parsingStatus === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-slate-850 rounded-3xl"
              >
                <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
                  <FileText className="text-indigo-400 animate-pulse" size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">Analyzing Resume Structure</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Extracting text characters, aligning layout boundaries, and parsing key skills...
                </p>
                <div className="w-full max-w-xs bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${parsingProgress}%` }}
                  />
                </div>
              </motion.div>
            )}

            {/* 2. Not Parsed State */}
            {parsingStatus === 'not_parsed' && (
              <motion.div
                key="not_parsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-slate-850 rounded-3xl text-center"
              >
                <div className="w-16 h-16 bg-slate-900 text-indigo-400 border border-slate-850 rounded-2xl flex items-center justify-center mb-5">
                  <Play size={24} className="ml-1" />
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-2">Ready to Parse</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                  The resume "{getActiveResumeName()}" has not been parsed into structured datasets yet. Click below to begin text extraction.
                </p>
                <button
                  onClick={handleParseResume}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Play size={12} className="fill-white" /> Start Parsing
                </button>
              </motion.div>
            )}

            {/* 3. Failed State */}
            {parsingStatus === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 bg-red-950/5 border border-red-900/20 rounded-3xl text-center"
              >
                <div className="w-16 h-16 bg-red-950/20 text-red-400 border border-red-900/30 rounded-2xl flex items-center justify-center mb-5">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-bold text-red-400 mb-2">Parsing Failure</h3>
                <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
                  {parsingError}
                </p>
                <button
                  onClick={handleParseResume}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} /> Retry Parsing
                </button>
              </motion.div>
            )}

            {/* 4. Parsed Data Presentation */}
            {parsingStatus === 'parsed' && parsedData && (
              <motion.div
                key="parsed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Internal Search Bar */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-2xl w-full">
                  <Search size={16} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search inside extracted content..."
                    className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-600 focus:outline-none w-full"
                  />
                </div>

                {/* --- Section 1: Personal Info --- */}
                {filterMatches(parsedData.personalInfo?.fullName) && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('personalInfo')} className="section-header-btn">
                      <span className="section-title">
                        <User size={16} className="section-icon-wrapper" /> Personal Information
                      </span>
                      {expandedSections.personalInfo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.personalInfo && (
                      <div className="section-content border-t border-slate-850">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {parsedData.personalInfo?.fullName && (
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Full Name</span>
                              <span className="text-slate-200 font-bold text-sm">{parsedData.personalInfo.fullName}</span>
                            </div>
                          )}
                          {parsedData.personalInfo?.email && (
                            <div className="flex items-center gap-2.5 text-left text-slate-300">
                              <Mail size={14} className="text-indigo-400 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">Email</span>
                                <span>{parsedData.personalInfo.email}</span>
                              </div>
                            </div>
                          )}
                          {parsedData.personalInfo?.phone && (
                            <div className="flex items-center gap-2.5 text-left text-slate-300">
                              <Phone size={14} className="text-indigo-400 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">Phone</span>
                                <span>{parsedData.personalInfo.phone}</span>
                              </div>
                            </div>
                          )}
                          {parsedData.personalInfo?.location && (
                            <div className="flex items-center gap-2.5 text-left text-slate-300">
                              <MapPin size={14} className="text-indigo-400 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">Location</span>
                                <span>{parsedData.personalInfo.location}</span>
                              </div>
                            </div>
                          )}
                          {parsedData.personalInfo?.linkedin && (
                            <div className="flex items-center gap-2.5 text-left text-slate-350 hover:text-slate-100 transition-colors">
                              <Globe size={14} className="text-indigo-400 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">LinkedIn</span>
                                <a href={parsedData.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                  Profile link <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          )}
                          {parsedData.personalInfo?.github && (
                            <div className="flex items-center gap-2.5 text-left text-slate-350 hover:text-slate-100 transition-colors">
                              <FolderGit size={14} className="text-indigo-400 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">GitHub</span>
                                <a href={parsedData.personalInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                  Repositories <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          )}
                          {parsedData.personalInfo?.portfolio && (
                            <div className="flex items-center gap-2.5 text-left text-slate-350 hover:text-slate-100 transition-colors">
                              <Globe size={14} className="text-indigo-400 shrink-0" />
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold">Portfolio</span>
                                <a href={parsedData.personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                  Website <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 2: Education --- */}
                {parsedData.education?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('education')} className="section-header-btn">
                      <span className="section-title">
                        <GraduationCap size={16} className="section-icon-wrapper" /> Education
                      </span>
                      {expandedSections.education ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.education && (
                      <div className="section-content border-t border-slate-850 space-y-4">
                        {parsedData.education
                          .filter((edu) => filterMatches(edu.college) || filterMatches(edu.degree) || filterMatches(edu.branch))
                          .map((edu, index) => (
                            <div key={index} className="bg-slate-950/40 border border-slate-850/50 p-4 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4 text-left">
                              <div>
                                <h4 className="text-xs font-bold text-slate-200 mb-1">{edu.college}</h4>
                                <p className="text-[11px] text-indigo-400 font-semibold">{edu.degree} in {edu.branch}</p>
                              </div>
                              <div className="flex md:flex-col items-start md:items-end justify-between md:justify-start gap-2 shrink-0">
                                <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 flex items-center gap-1.5 font-semibold">
                                  <Calendar size={10} /> {edu.startYear} - {edu.endYear}
                                </span>
                                {(edu.cgpa || edu.percentage) && (
                                  <span className="text-[10px] bg-emerald-950/30 border border-emerald-900/30 px-2.5 py-0.5 rounded-full text-emerald-400 font-bold uppercase tracking-wider">
                                    Grade: {edu.cgpa || edu.percentage}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 3: Skills --- */}
                {expandedSections.skills && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('skills')} className="section-header-btn">
                      <span className="section-title">
                        <Code size={16} className="section-icon-wrapper" /> Technical Skills
                      </span>
                      {expandedSections.skills ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.skills && (
                      <div className="section-content border-t border-slate-850">
                        <div className="skills-grid">
                          {/* Categorized Skills display */}
                          {Object.entries({
                            'Languages': parsedData.skills?.programmingLanguages,
                            'Frameworks': parsedData.skills?.frameworks,
                            'Libraries': parsedData.skills?.libraries,
                            'Databases': parsedData.skills?.databases,
                            'Cloud platforms': parsedData.skills?.cloud,
                            'DevOps & Build': parsedData.skills?.devops,
                            'Tools': parsedData.skills?.tools,
                            'Soft Skills': parsedData.skills?.softSkills,
                          }).map(([categoryName, skillList]) => {
                            if (!skillList || skillList.length === 0) return null;
                            const filteredList = skillList.filter(s => filterMatches(s));
                            if (filteredList.length === 0) return null;
                            return (
                              <div key={categoryName} className="skills-category-card">
                                <h4 className="skills-category-title text-left">{categoryName}</h4>
                                <div className="skills-badges-list">
                                  {filteredList.map((skill, index) => (
                                    <Badge key={index} variant="info">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 4: Professional Experience --- */}
                {parsedData.experience?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('experience')} className="section-header-btn">
                      <span className="section-title">
                        <Briefcase size={16} className="section-icon-wrapper" /> Work Experience
                      </span>
                      {expandedSections.experience ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.experience && (
                      <div className="section-content border-t border-slate-850 space-y-5">
                        {parsedData.experience
                          .filter((exp) => filterMatches(exp.company) || filterMatches(exp.role) || filterListMatches(exp.responsibilities))
                          .map((exp, index) => (
                            <div key={index} className="space-y-3 text-left">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-100">{exp.role}</h4>
                                  <p className="text-[11px] text-indigo-400 font-semibold">{exp.company}</p>
                                </div>
                                <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 flex items-center gap-1.5 w-fit font-semibold">
                                  <Calendar size={10} /> {exp.duration}
                                </span>
                              </div>
                              <ul className="bullet-list pl-0">
                                {exp.responsibilities?.map((bullet, bulletIdx) => (
                                  <li key={bulletIdx} className="bullet-item">
                                    <span className="bullet-dot" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 5: Internships --- */}
                {parsedData.internships?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('internships')} className="section-header-btn">
                      <span className="section-title">
                        <Briefcase size={16} className="section-icon-wrapper" /> Internships
                      </span>
                      {expandedSections.internships ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.internships && (
                      <div className="section-content border-t border-slate-850 space-y-5">
                        {parsedData.internships
                          .filter((intern) => filterMatches(intern.company) || filterMatches(intern.role) || filterListMatches(intern.responsibilities))
                          .map((intern, index) => (
                            <div key={index} className="space-y-3 text-left">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-100">{intern.role}</h4>
                                  <p className="text-[11px] text-indigo-400 font-semibold">{intern.company}</p>
                                </div>
                                <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 flex items-center gap-1.5 w-fit font-semibold">
                                  <Calendar size={10} /> {intern.duration}
                                </span>
                              </div>
                              <ul className="bullet-list pl-0">
                                {intern.responsibilities?.map((bullet, bulletIdx) => (
                                  <li key={bulletIdx} className="bullet-item">
                                    <span className="bullet-dot" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 6: Projects --- */}
                {parsedData.projects?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('projects')} className="section-header-btn">
                      <span className="section-title">
                        <FolderGit size={16} className="section-icon-wrapper" /> Projects
                      </span>
                      {expandedSections.projects ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.projects && (
                      <div className="section-content border-t border-slate-850 space-y-5">
                        {parsedData.projects
                          .filter((proj) => filterMatches(proj.projectName) || filterMatches(proj.description) || filterListMatches(proj.technologies))
                          .map((proj, index) => (
                            <div key={index} className="bg-slate-950/30 border border-slate-850/50 p-4 rounded-xl flex flex-col gap-3 text-left">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-200">{proj.projectName}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 flex items-center gap-1.5 font-semibold">
                                    <Calendar size={10} /> {proj.duration}
                                  </span>
                                  {proj.githubLink && (
                                    <a
                                      href={proj.githubLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-900/30 flex items-center gap-1 transition-colors"
                                    >
                                      GitHub <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>
                              {proj.technologies?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                  {proj.technologies.map((tech, techIdx) => (
                                    <Badge key={techIdx} variant="info">{tech}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 7: Certifications --- */}
                {parsedData.certifications?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('certifications')} className="section-header-btn">
                      <span className="section-title">
                        <Award size={16} className="section-icon-wrapper" /> Certifications
                      </span>
                      {expandedSections.certifications ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.certifications && (
                      <div className="section-content border-t border-slate-850 space-y-3">
                        {parsedData.certifications
                          .filter((cert) => filterMatches(cert.certificationName) || filterMatches(cert.organization))
                          .map((cert, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/20 border border-slate-850/30 p-3 rounded-xl text-left">
                              <div>
                                <h4 className="text-xs font-bold text-slate-200">{cert.certificationName}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Issued by {cert.organization}</p>
                              </div>
                              <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 flex items-center gap-1.5 w-fit font-semibold">
                                <Calendar size={10} /> {cert.date}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 8: Achievements --- */}
                {parsedData.achievements?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('achievements')} className="section-header-btn">
                      <span className="section-title">
                        <Award size={16} className="section-icon-wrapper" /> Key Achievements
                      </span>
                      {expandedSections.achievements ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.achievements && (
                      <div className="section-content border-t border-slate-850">
                        <ul className="bullet-list pl-0">
                          {parsedData.achievements
                            .filter((ach) => filterMatches(ach))
                            .map((ach, index) => (
                              <li key={index} className="bullet-item">
                                <span className="bullet-dot" />
                                <span>{ach}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Section 9: Languages --- */}
                {parsedData.languages?.length > 0 && (
                  <div className="section-card">
                    <button onClick={() => toggleSection('languages')} className="section-header-btn">
                      <span className="section-title">
                        <Languages size={16} className="section-icon-wrapper" /> Languages Spoken
                      </span>
                      {expandedSections.languages ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {expandedSections.languages && (
                      <div className="section-content border-t border-slate-850">
                        <div className="skills-badges-list">
                          {parsedData.languages
                            .filter((lang) => filterMatches(lang))
                            .map((lang, index) => (
                              <Badge key={index} variant="success">{lang}</Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
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
