import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Play, RefreshCw, Printer, Download, Copy, CheckCircle,
  AlertTriangle, Clock, ChevronRight, ChevronLeft, Send, Sparkles,
  Award, ShieldCheck, Heart, AlertCircle, HelpCircle, BookOpen, Trash2,
  Calendar, Briefcase, Plus, Search, Timer, Circle, Check,
  Mic, MicOff, Volume2, VolumeX, Pause, RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar
} from 'recharts';
import './InterviewPrep.css';

// Services
import resumeService from '../../services/resumeService';
import jobMatchingService from '../../services/jobMatchingService';
import interviewPrepService from '../../services/interviewPrepService';

// Common Components
import Badge from '../../components/common/Badge';
import VoiceVisualizer from '../../components/interview/VoiceVisualizer';

export default function InterviewPrep() {
  const [resumes, setResumes] = useState([]);
  const [jds, setJds] = useState([]);
  
  // Setup config states
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [interviewType, setInterviewType] = useState('TECHNICAL');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('MEDIUM');

  // Interview state machine
  const [sessionState, setSessionState] = useState('setup'); // setup, active, evaluating, results
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // questionId -> answer text

  // Evaluation results
  const [reportData, setReportData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Timer parameters (120s per question)
  const [timeLeft, setTimeLeft] = useState(120);
  const timerIntervalRef = useRef(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Voice Mode States
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recruiterSpeaking, setRecruiterSpeaking] = useState(false);
  const [micStream, setMicStream] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);

  const recognitionRef = useRef(null);
  const synthesisUtteranceRef = useRef(null);

  // Radar chart config
  const radarCircumference = 2 * Math.PI * 25;

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchInitialData = async () => {
    setWorkspaceLoading(true);
    try {
      const resumeResp = await resumeService.getAllResumes();
      if (resumeResp.success) {
        const list = resumeResp.data || [];
        setResumes(list);
        if (list.length > 0) {
          setSelectedResumeId(list[0].id);
        }
      }

      const jdResp = await jobMatchingService.getJobDescriptions();
      if (jdResp.success) {
        setJds(jdResp.data || []);
        if (jdResp.data?.length > 0) {
          setSelectedJdId(jdResp.data[0].id);
        }
      }

      fetchHistory();
    } catch (err) {
      showToast('error', 'Failed to retrieve setup configurations.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await interviewPrepService.getHistory();
      if (response.success) {
        setHistoryList(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load session history logs', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Speech helper actions
  const startListening = async () => {
    if (isListening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      showToast('error', 'Microphone permission denied.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    setIsListening(false);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          const qId = questions[currentIndex]?.id;
          if (qId) {
            setUserAnswers(prev => ({
              ...prev,
              [qId]: (prev[qId] || '') + finalTranscript
            }));
          }
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          showToast('error', 'Microphone access is not allowed.');
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, [currentIndex, questions]);

  // Handle Voice Mode Speech trigger on question advance
  useEffect(() => {
    if (sessionState !== 'active' || !isVoiceMode || questions.length === 0) {
      window.speechSynthesis?.cancel();
      stopListening();
      return;
    }

    const speakQuestion = () => {
      window.speechSynthesis?.cancel();
      stopListening();

      const text = questions[currentIndex]?.question;
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        setRecruiterSpeaking(true);
      };
      utterance.onend = () => {
        setRecruiterSpeaking(false);
        // Automatically start listening after recruiter finishes speaking
        startListening();
      };
      utterance.onerror = () => {
        setRecruiterSpeaking(false);
      };

      // Select standard English voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en-'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      synthesisUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Wait a brief delay to let page mount
    const timer = setTimeout(speakQuestion, 500);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, [sessionState, currentIndex, isVoiceMode, questions]);

  // Timer ticks hook for active interview
  useEffect(() => {
    if (sessionState !== 'active' || timerPaused) {
      clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired! Auto advance or submit
          clearInterval(timerIntervalRef.current);
          showToast('warning', 'Time limit expired for this question! Auto-advancing...');
          handleAutoAdvance();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [sessionState, currentIndex, timerPaused]);

  const handleAutoAdvance = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(120);
    } else {
      handleSubmitInterview();
    }
  };

  // Setup mock session questions
  const handleStartMockInterview = async () => {
    if (!selectedResumeId) {
      showToast('error', 'Please select a resume from your library.');
      return;
    }
    if (!targetRole.trim()) {
      showToast('error', 'Please enter a target job role.');
      return;
    }

    setSessionState('evaluating'); // show intermediate loader
    try {
      const payload = {
        resumeId: selectedResumeId,
        jobDescriptionId: selectedJdId || null,
        interviewType,
        targetRole,
        difficulty
      };
      
      const response = await interviewPrepService.startSession(payload);
      if (response.success && response.data) {
        setActiveSession(response.data);
        setQuestions(response.data.questions || []);
        setCurrentIndex(0);
        setUserAnswers({});
        setTimeLeft(120);
        setSessionState('active');
        showToast('success', 'Mock interview questions generated.');
      }
    } catch (err) {
      setSessionState('setup');
      showToast('error', 'Failed to generate questions. Try running resume analysis first.');
    }
  };

  // Answer text update
  const handleAnswerChange = (value) => {
    const qId = questions[currentIndex]?.id;
    if (qId) {
      setUserAnswers((prev) => ({
        ...prev,
        [qId]: value
      }));
    }
  };

  // Submit interview answers list for evaluation
  const handleSubmitInterview = async () => {
    clearInterval(timerIntervalRef.current);
    setSessionState('evaluating');

    // Build payload
    const answersList = Object.entries(userAnswers).map(([qId, ansText]) => ({
      questionId: qId,
      userResponse: ansText
    }));

    // Check if any question is missing answers, fill with empty
    questions.forEach((q) => {
      const answered = answersList.some((a) => a.questionId === q.id);
      if (!answered) {
        answersList.push({
          questionId: q.id,
          userResponse: 'No response provided.'
        });
      }
    });

    try {
      const payload = {
        sessionId: activeSession.id,
        answers: answersList
      };

      const response = await interviewPrepService.evaluateSession(payload);
      if (response.success && response.data) {
        setReportData(response.data);
        setSessionState('results');
        fetchHistory();
        showToast('success', 'Evaluation grading complete!');
      }
    } catch (err) {
      setSessionState('active');
      showToast('error', 'Evaluation submission failed.');
    }
  };

  // Review historic report card
  const handleViewHistoricReport = async (sessionId) => {
    setSessionState('evaluating');
    try {
      const response = await interviewPrepService.getReport(sessionId);
      if (response.success && response.data) {
        setReportData(response.data);
        setSessionState('results');
        showToast('success', 'Loaded previous report card.');
      }
    } catch (err) {
      setSessionState('setup');
      showToast('error', 'Failed to retrieve report card.');
    }
  };

  // Recharts radar scores
  const getRadarData = () => {
    if (!reportData) return [];
    // Categories scores maps: estimate sub-scores
    return [
      { subject: 'Communication', A: reportData.overallScore - 5, fullMark: 100 },
      { subject: 'Technical Accuracy', A: reportData.overallScore + 2, fullMark: 100 },
      { subject: 'Completeness', A: reportData.overallScore - 10, fullMark: 100 },
      { subject: 'Problem Solving', A: reportData.overallScore + 5, fullMark: 100 },
      { subject: 'Professionalism', A: reportData.overallScore, fullMark: 100 },
    ];
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-450';
    return 'text-rose-450';
  };

  const getScoreBgClass = (score) => {
    if (score >= 80) return 'bg-emerald-950/20 text-emerald-450 border-emerald-900/30';
    if (score >= 60) return 'bg-amber-950/20 text-amber-450 border-amber-900/30';
    return 'bg-rose-950/20 text-rose-450 border-rose-900/30';
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
    link.download = `interview_report_${reportData.sessionId.toString().substring(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('success', 'JSON report exported.');
  };

  return (
    <div className="page-interviewprep flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="text-left">
          <h1 className="text-slate-100 text-2xl font-extrabold tracking-tight m-0">
            AI Interview Prep
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Conduct recruiter-style mock interviews, trace question items, and audit ratings.
          </p>
        </div>

        {/* Global Toolbar */}
        {sessionState === 'results' && reportData && (
          <div className="global-toolbar flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer size={13} /> Print/Save PDF
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download size={13} /> Export JSON
            </button>
            <button
              onClick={() => setSessionState('setup')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> New Mock Session
            </button>
          </div>
        )}
      </div>

      {/* Screen Views */}
      <AnimatePresence mode="wait">
        
        {/* 1. SETUP SCREEN */}
        {sessionState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="setup-grid"
          >
            {/* Form card */}
            <div className="setup-card">
              <h3 className="setup-title">Mock Session Config</h3>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Resume Reference</span>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none w-full"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.resumeTitle}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Optional Target Job Description</span>
                  <select
                    value={selectedJdId}
                    onChange={(e) => setSelectedJdId(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none w-full"
                  >
                    <option value="">-- No specific Job Description --</option>
                    {jds.map((j) => (
                      <option key={j.id} value={j.id}>{j.jobTitle} at {j.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Interview Category</span>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-350 focus:outline-none w-full"
                  >
                    {['TECHNICAL', 'BEHAVIORAL', 'HR', 'SYSTEM_DESIGN', 'MIXED'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Target Role Title</span>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Backend Developer"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Difficulty Threshold</span>
                <div className="flex gap-2">
                  {['EASY', 'MEDIUM', 'HARD'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        difficulty === d
                          ? 'bg-indigo-650/10 border-indigo-900 text-indigo-400'
                          : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartMockInterview}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer w-full mt-2"
              >
                <Play size={13} /> Start Mock Session
              </button>
            </div>

            {/* History logs sidebar list */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="setup-title border-none mb-0">Previous Sessions History</h3>
              {historyList.length > 0 ? (
                <div className="space-y-3">
                  {historyList.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleViewHistoricReport(h.id)}
                      className="w-full bg-slate-950/20 border border-slate-850 hover:bg-slate-900/30 p-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{h.targetRole}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Type: {h.interviewType} • Diff: {h.difficulty}
                        </p>
                      </div>
                      {h.score != null && (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getScoreBgClass(h.score)}`}>
                          {h.score}/100 Score
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/15 border border-slate-850/50 p-6 rounded-2xl text-center text-slate-500 text-xs italic">
                  No previous mock sessions logged. Choose config details and click Start above!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. ACTIVE INTERVIEW SCREEN */}
        {sessionState === 'active' && questions.length > 0 && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="question-workspace"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <span className="text-[9px] text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded-full font-bold uppercase">
                  {activeSession?.interviewType} ({activeSession?.difficulty})
                </span>
                <h3 className="text-sm font-extrabold text-slate-200 mt-1">
                  Mock Interview: {activeSession?.targetRole}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {/* Voice Mode Toggle */}
                <button
                  onClick={() => {
                    const next = !isVoiceMode;
                    setIsVoiceMode(next);
                    if (!next) {
                      window.speechSynthesis?.cancel();
                      stopListening();
                    } else {
                      const text = questions[currentIndex]?.question;
                      if (text) {
                        window.speechSynthesis?.cancel();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.onstart = () => setRecruiterSpeaking(true);
                        utterance.onend = () => {
                          setRecruiterSpeaking(false);
                          startListening();
                        };
                        window.speechSynthesis.speak(utterance);
                      }
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    isVoiceMode
                      ? 'bg-indigo-950/30 border-indigo-550 text-indigo-400'
                      : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isVoiceMode ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  Voice Mode: {isVoiceMode ? 'ON' : 'OFF'}
                </button>

                {/* Timer ring with controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTimerPaused(!timerPaused)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      timerPaused
                        ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/50'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-amber-400 hover:bg-amber-950/20'
                    }`}
                    title={timerPaused ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {timerPaused ? <Play size={13} className="fill-emerald-400" /> : <Pause size={13} />}
                  </button>
                  <div className="timer-ring">
                    <svg width="60" height="60" className="rotate-[-90deg]">
                      <circle cx="30" cy="30" r="25" fill="transparent" stroke="#1e293b" strokeWidth="3" />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="transparent"
                        stroke={timeLeft > 30 ? '#6366f1' : timeLeft > 10 ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 25}
                        strokeDashoffset={2 * Math.PI * 25 - (timeLeft / 120) * (2 * Math.PI * 25)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-xs font-bold ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : timeLeft <= 30 ? 'text-amber-400' : 'text-slate-100'}`}>
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setTimeLeft(120); setTimerPaused(false); }}
                    className="p-1.5 rounded-lg border bg-slate-900/40 border-slate-850 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer"
                    title="Reset Timer to 2:00"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Question card */}
            <div className="bg-slate-950/40 border border-slate-850/80 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Category: {questions[currentIndex]?.category}</span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-200 leading-relaxed">
                {questions[currentIndex]?.question}
              </h2>
              {questions[currentIndex]?.hints && (
                <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
                  <BookOpen size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p><strong>Hint:</strong> {questions[currentIndex].hints}</p>
                </div>
              )}
            </div>

            {/* Textarea answer box */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Your Answer Response</span>
                
                {/* Voice Indicators */}
                {isVoiceMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {recruiterSpeaking 
                        ? 'AI Recruiter Speaking...' 
                        : isListening 
                          ? 'Listening... Speak Now' 
                          : 'Microphone Idle'}
                    </span>
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={recruiterSpeaking}
                      className={`flex items-center justify-center p-2 rounded-full border transition-all cursor-pointer disabled:opacity-30 ${
                        isListening
                          ? 'bg-rose-950/20 border-rose-700 text-rose-450 animate-pulse'
                          : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                    </button>
                  </div>
                )}
              </div>

              {isVoiceMode && (
                <div className="bg-slate-950/20 border border-slate-850 p-2.5 rounded-xl flex items-center justify-center">
                  <VoiceVisualizer isActive={isListening || recruiterSpeaking} stream={micStream} />
                </div>
              )}

              <textarea
                value={userAnswers[questions[currentIndex]?.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={isVoiceMode ? "Microphone active. Speak your answer or type here..." : "Formulate your response details here..."}
                className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none min-h-[140px] resize-y"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-slate-850 pt-4">
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex((prev) => prev - 1);
                    setTimeLeft(120);
                  }
                }}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-30"
              >
                <ChevronLeft size={13} /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => prev + 1);
                    setTimeLeft(120);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Next Question <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitInterview}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-650 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Send size={13} /> Submit Interview
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. EVALUATING LOADER */}
        {sessionState === 'evaluating' && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-24 bg-slate-900/20 border border-slate-850 rounded-3xl"
          >
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
              <ShieldCheck className="text-indigo-400 animate-pulse" size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Analyzing Mock Answers</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-2">
              Cross-referencing technical checklists, grading communication styles, and compiling study roadmaps...
            </p>
          </motion.div>
        )}

        {/* 4. RESULTS REPORT SCREEN */}
        {sessionState === 'results' && reportData && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="results-workspace text-left"
          >
            {/* Top Score summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div className="chart-card flex flex-col items-center justify-center p-6 bg-slate-900/30 border border-slate-850 rounded-3xl col-span-1">
                <svg width="120" height="120" className="gauge-circle">
                  <circle cx="60" cy="60" r="25" fill="transparent" stroke="#1e293b" strokeWidth="5" />
                  <circle
                    cx="60"
                    cy="60"
                    r="25"
                    fill="transparent"
                    stroke={reportData.overallScore >= 80 ? '#10b981' : '#f59e0b'}
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 25}
                    strokeDashoffset={2 * Math.PI * 25 - (reportData.overallScore / 100) * (2 * Math.PI * 25)}
                  />
                  <text x="60" y="55" className="text-xs font-extrabold fill-slate-200 text-center" textAnchor="middle">
                    {reportData.overallScore}%
                  </text>
                  <text x="60" y="75" className="text-[9px] text-slate-500 font-bold uppercase fill-slate-550 text-center" textAnchor="middle">
                    GRADE
                  </text>
                </svg>
                <div className="mt-4">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${getScoreBgClass(reportData.overallScore)}`}>
                    Overall Performance
                  </span>
                </div>
              </div>

              {/* Sub-ratings charts */}
              <div className="chart-card bg-slate-900/30 border border-slate-850 p-6 rounded-3xl col-span-1 md:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Radar performance</h3>
                <div className="w-full h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                      <PolarRadiusAxis stroke="#1e293b" angle={30} domain={[0, 100]} />
                      <Radar name="Performance" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses card lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
                  Interview Strengths
                </h4>
                <div className="text-xs text-slate-350 space-y-2 leading-relaxed">
                  {reportData.strengths?.split('\n').map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{bullet.replace(/^-\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-rose-450 uppercase tracking-widest flex items-center gap-1.5">
                  Weaknesses / Areas of Improvement
                </h4>
                <div className="text-xs text-slate-350 space-y-2 leading-relaxed">
                  {reportData.weaknesses?.split('\n').map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>{bullet.replace(/^-\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Question feedback card grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                Question-by-Question Grading
              </h3>
              <div className="space-y-4">
                {reportData.evaluations?.map((fb, idx) => (
                  <div key={idx} className="evaluation-question-card bg-slate-950/30 border border-slate-850 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Question {idx + 1}</span>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getScoreBgClass(fb.score)}`}>
                        Score: {fb.score}/100
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-200 mb-1">{fb.question}</h4>
                      <p className="text-[11px] text-slate-450 bg-slate-950 border border-slate-900 p-2.5 rounded-xl italic">
                        " {fb.userResponse} "
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <strong className="text-slate-300 block mb-1">AI Evaluator Feedback:</strong>
                        <p className="text-slate-400 leading-relaxed">{fb.aiFeedback}</p>
                      </div>
                      <div>
                        <strong className="text-slate-300 block mb-1">Suggestions to stand out:</strong>
                        <p className="text-slate-400 leading-relaxed">{fb.improvementSuggestions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study suggestions roadmap */}
            {reportData.learningRoadmap && (
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl text-left">
                {/* Clean markdown outlines */}
                <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  {reportData.learningRoadmap.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('###')) {
                      return <h4 key={idx} className="text-xs font-bold text-slate-100 mt-4 mb-2">{trimmed.substring(3).trim()}</h4>;
                    }
                    if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
                      return <p key={idx} className="text-xs font-semibold text-slate-200 mt-2.5">{trimmed}</p>;
                    }
                    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                      return <div key={idx} className="pl-4 text-slate-350">• {trimmed.substring(1).trim()}</div>;
                    }
                    return <p key={idx}>{trimmed}</p>;
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast alert popup ring */}
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
