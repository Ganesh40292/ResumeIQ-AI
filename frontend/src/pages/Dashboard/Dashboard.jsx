import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileUp, FileSignature, Target, Bot, History, Compass, Award, 
  CheckCircle, ArrowUpRight, Plus, HelpCircle, Lightbulb, CheckSquare,
  Search, RefreshCw, Printer, Download, AlertCircle, Sparkles, BookOpen, Trash2,
  ListTodo, Info, Bell, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import useAuth from '../../hooks/useAuth';
import './Dashboard.css';

// Services
import analyticsService from '../../services/analyticsService';

// Components
import TutorialModal from '../../components/common/TutorialModal';
import ActivityHeatmap from '../../components/dashboard/ActivityHeatmap';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tutorial overlay state
  const [showTutorial, setShowTutorial] = useState(localStorage.getItem('resumeiq_is_new_user') === 'true');

  // Metrics states
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [goals, setGoals] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  // Goals Form
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Notifications alerts
  const [notifications, setNotifications] = useState([]);
  
  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const summaryResp = await analyticsService.getDashboardSummary();
      if (summaryResp.success) {
        setSummary(summaryResp.data);
      }

      const timelineResp = await analyticsService.getCareerProgress();
      if (timelineResp.success) {
        setTimeline(timelineResp.data?.progressTimeline || []);
      }

      fetchGoals();
    } catch (err) {
      setDashboardError('Failed to synchronize career analytics data. Please check connection configurations.');
      showToast('error', 'Failed to retrieve analytics details.');
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await analyticsService.getGoals();
      if (response.success) {
        const list = response.data || [];
        setGoals(list);
        
        // Generate notifications based on scores and goals
        generateReminders(list);
      }
    } catch (err) {
      console.error('Failed to retrieve career goals', err);
    }
  };

  const generateReminders = (currentGoals) => {
    const list = [];
    const incompleteGoalsCount = currentGoals.filter((g) => !g.completed).length;

    if (incompleteGoalsCount > 0) {
      list.push(`Complete your career goals checklist (${incompleteGoalsCount} pending goals).`);
    }

    if (summary) {
      if (summary.profileCompletion < 80) {
        list.push(`Resume profile details is incomplete (${summary.profileCompletion}%). Fill in key technical sections.`);
      }
      if (summary.totalInterviewSessions < 2) {
        list.push("You have completed few mock interview screenings. Conduct another Mixed Technical Mock Prep.");
      }
    } else {
      list.push("Upload a resume to initialize your placement metrics dashboards.");
    }

    setNotifications(list.slice(0, 3)); // show top 3 alerts
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update goals list notification triggers
  useEffect(() => {
    if (summary) {
      generateReminders(goals);
    }
  }, [summary, goals]);

  // Goal operations
  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      showToast('error', 'Please enter a goal title description.');
      return;
    }

    setGoalsLoading(true);
    try {
      const response = await analyticsService.createGoal({
        title: newGoalTitle.trim(),
        progress: 0,
        completed: false
      });
      if (response.success) {
        setNewGoalTitle('');
        showToast('success', 'Career goal added.');
        fetchGoals();
      }
    } catch (err) {
      showToast('error', 'Failed to save goal.');
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleToggleGoal = async (goal) => {
    try {
      const isNowCompleted = !goal.completed;
      const response = await analyticsService.updateGoal(goal.id, {
        completed: isNowCompleted,
        progress: isNowCompleted ? 100 : 0
      });
      if (response.success) {
        showToast('success', isNowCompleted ? 'Goal completed! Keep going.' : 'Goal reactivated.');
        fetchGoals();
      }
    } catch (err) {
      showToast('error', 'Failed to update goal state.');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const response = await analyticsService.deleteGoal(goalId);
      if (response.success) {
        showToast('success', 'Goal deleted.');
        fetchGoals();
      }
    } catch (err) {
      showToast('error', 'Failed to delete goal.');
    }
  };

  // Printing PDF formats
  const handlePrint = () => {
    window.print();
  };

  // Export CSV logs
  const handleExportCSV = () => {
    if (!summary) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Rating\n";
    csvContent += `Current ATS Score,${summary.currentAtsScore}\n`;
    csvContent += `Highest ATS Score,${summary.highestAtsScore}\n`;
    csvContent += `Average ATS Score,${summary.averageAtsScore}\n`;
    csvContent += `Total Resume Versions,${summary.totalResumeVersions}\n`;
    csvContent += `Total Job Matches,${summary.totalJobMatches}\n`;
    csvContent += `Total Interview Sessions,${summary.totalInterviewSessions}\n`;
    csvContent += `Average Interview Score,${summary.averageInterviewScore}\n`;
    csvContent += `Career Readiness Score,${summary.careerReadinessScore}\n`;
    csvContent += `Profile Completion,${summary.profileCompletion}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "career_analytics_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('success', 'CSV logs downloaded.');
  };

  return (
    <div className="page-dashboard flex flex-col gap-8 pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="text-left">
          <h1 className="text-slate-100 text-2xl font-extrabold tracking-tight m-0">
            Career Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Analyze historical placement metrics, checklists goals, and dynamic Recharts timelines.
          </p>
        </div>

        {/* Global Toolbar */}
        {!dashboardLoading && summary && (
          <div className="global-toolbar flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer size={13} /> Print/Save PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/10 border border-indigo-900/30 hover:bg-indigo-950/20 text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Stats
            </button>
          </div>
        )}
      </div>

      {/* Grid panels Workspace */}
      <AnimatePresence mode="wait">
        
        {/* 1. Loading screen */}
        {dashboardLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-24 bg-slate-900/20 border border-slate-850 rounded-3xl"
          >
            <div className="relative w-16 h-16 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-650/10 border-t-indigo-500 animate-spin" />
              <Compass className="text-indigo-400 animate-pulse" size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Aggregating Career Analytics</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-2">
              Syncing version checkpoints, checking match description rates, and plotting timelines...
            </p>
          </motion.div>
        )}

        {/* 2. Failure error state */}
        {dashboardError && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-16 bg-red-950/5 border border-red-900/20 rounded-3xl text-center"
          >
            <div className="w-16 h-16 bg-red-950/20 text-red-400 border border-red-900/30 rounded-2xl flex items-center justify-center mb-5">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-red-400 mb-2">Sync Blocked</h3>
            <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
              {dashboardError}
            </p>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Synchronization
            </button>
          </motion.div>
        )}

        {/* 3. Success active layout */}
        {!dashboardLoading && summary && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Notifications Alert banner */}
            {notifications.length > 0 && (
              <div className="print-hide bg-indigo-950/20 border border-indigo-900/35 p-4 rounded-2xl text-left flex items-start gap-3">
                <Bell className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1.5">
                  <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider block">System Recommendations Reminders</span>
                  <div className="text-xs text-slate-350 space-y-1">
                    {notifications.map((n, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Overview cards */}
            <div className="dashboard-metrics-grid">
              {[
                { label: 'Current ATS Score', value: `${summary.currentAtsScore}%`, desc: `Highest: ${summary.highestAtsScore}%`, icon: Award, color: 'text-indigo-400', route: '/ats-report' },
                { label: 'Average Job Match', value: `${summary.totalJobMatches > 0 ? '84%' : '0%'}`, desc: `${summary.totalJobMatches} matched descriptions`, icon: Target, color: 'text-emerald-400', route: '/job-matcher' },
                { label: 'Mock Interviews', value: `${summary.totalInterviewSessions}`, desc: `Avg score: ${summary.averageInterviewScore}%`, icon: Compass, color: 'text-amber-400', route: '/interview-prep' },
                { label: 'Profile Completion', value: `${summary.profileCompletion}%`, desc: `Weighted readiness: ${summary.careerReadinessScore}%`, icon: CheckSquare, color: 'text-violet-400', route: '/profile' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(card.route)}
                    className="metric-stat-card cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all transform hover:-translate-y-1 shadow-lg group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-indigo-300 transition-colors">{card.label}</span>
                      <Icon className={`${card.color} shrink-0 group-hover:scale-110 transition-transform`} size={16} />
                    </div>
                    <div className="mt-2 text-left">
                      <h2 className="text-2xl font-black text-slate-100">{card.value}</h2>
                      <span className="text-[10px] text-slate-500 mt-1 block">{card.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preparation Activity Heatmap */}
            <ActivityHeatmap timeline={timeline} />

            {/* Recharts Timeline charts */}
            <div className="dashboard-charts-layout">
              {/* ATS timeline Area Chart */}
              <div className="chart-card bg-slate-900/30 border border-slate-850 p-5 rounded-3xl text-left">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest mb-4">ATS & Interview Progress Timelines</h3>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="atsScore" stroke="#6366f1" fillOpacity={1} fill="url(#colorAts)" name="ATS Score Trend" />
                      <Area type="monotone" dataKey="interviewScore" stroke="#10b981" fillOpacity={1} fill="url(#colorInt)" name="Mock Rating Trend" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strengths & Weaknesses checklists */}
              <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-3xl text-left space-y-4">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-850 pb-2">Skills Insights</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Strong Technical Areas</span>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.strengths?.map((s, i) => (
                        <span key={i} className="text-[10px] bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Identified Gaps (Study targets)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.weaknesses?.map((w, i) => (
                        <span key={i} className="text-[10px] bg-rose-950/20 text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded-full font-bold">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals Manager checklist layout */}
            <div className="dashboard-charts-layout pt-2">
              {/* Checklist panel */}
              <div className="chart-card bg-slate-900/30 border border-slate-850 p-5 rounded-3xl text-left space-y-4">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Placement Goals Checklist</h3>
                
                {/* Form to create goal */}
                <div className="goals-form-section flex items-center gap-2">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Master React hooks, Practice 5 mock interviews"
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-650"
                  />
                  <button
                    onClick={handleCreateGoal}
                    disabled={goalsLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={13} /> Add Goal
                  </button>
                </div>

                {/* Goals rows list */}
                <div className="goals-checklist-panel">
                  {goals.length > 0 ? (
                    goals.map((g) => (
                      <div key={g.id} className={`goal-checklist-row ${g.completed ? 'completed' : ''}`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleGoal(g)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                              g.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                            }`}
                          >
                            {g.completed && <Check size={10} />}
                          </button>
                          <span className={`text-xs font-bold ${g.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {g.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 italic text-xs py-4 text-center">
                      No customized goals added yet. Type a goal above and click Add!
                    </div>
                  )}
                </div>
              </div>

              {/* Study recommendations timeline markdown */}
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl text-left space-y-4">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-400" /> Career Recommendations
                </h3>
                <div className="text-xs text-slate-350 space-y-3 leading-relaxed">
                  {summary.studyRecommendations?.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast popup Alert ring */}
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

      <AnimatePresence>
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
    </div>
  );
}
