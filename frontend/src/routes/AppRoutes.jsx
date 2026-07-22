import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import Profile from '../pages/Profile/Profile';
import Settings from '../pages/Settings/Settings';
import UploadResume from '../pages/UploadResume/UploadResume';
import ResumeAnalysis from '../pages/ResumeAnalysis/ResumeAnalysis';
import ATSReport from '../pages/ATSReport/ATSReport';
import JobMatcher from '../pages/JobMatcher/JobMatcher';
import ResumeBuilder from '../pages/ResumeBuilder/ResumeBuilder';
import AIReview from '../pages/AIReview/AIReview';
import InterviewPrep from '../pages/InterviewPrep/InterviewPrep';
import History from '../pages/History/History';
import NotFound from '../pages/NotFound/NotFound';
import ProtectedRoute from './ProtectedRoute';
import LandingIntro from '../pages/LandingIntro/LandingIntro';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Main Pages */}
      <Route path="/" element={<LandingIntro />} />

      {/* Protected Dashboard & Workspace Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><DashboardLayout><UploadResume /></DashboardLayout></ProtectedRoute>} />
      <Route path="/analysis" element={<ProtectedRoute><DashboardLayout><ResumeAnalysis /></DashboardLayout></ProtectedRoute>} />
      <Route path="/ats" element={<ProtectedRoute><DashboardLayout><ATSReport /></DashboardLayout></ProtectedRoute>} />
      <Route path="/job-matcher" element={<ProtectedRoute><DashboardLayout><JobMatcher /></DashboardLayout></ProtectedRoute>} />
      <Route path="/builder" element={<ProtectedRoute><DashboardLayout><ResumeBuilder /></DashboardLayout></ProtectedRoute>} />
      <Route path="/ai-review" element={<ProtectedRoute><DashboardLayout><AIReview /></DashboardLayout></ProtectedRoute>} />
      <Route path="/interview-prep" element={<ProtectedRoute><DashboardLayout><InterviewPrep /></DashboardLayout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><DashboardLayout><History /></DashboardLayout></ProtectedRoute>} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}


