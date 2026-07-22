import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Award, Target, Compass, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import './TutorialModal.css';

export default function TutorialModal({ onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    {
      title: 'Upload & Parse Resumes',
      desc: 'Drag & drop your PDF or DOCX file. Our engine automatically parses experience details, skills tags, and contact parameters into a structured profile.',
      icon: FileUp,
      color: 'from-indigo-500 to-violet-500',
      shadowColor: 'rgba(99, 102, 241, 0.25)'
    },
    {
      title: 'Analyze ATS Compatibility',
      desc: 'Check formatting, readability, keywords, and layout structure ratings against standard ATS recruitment constraints without relying on AI APIs.',
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
      shadowColor: 'rgba(16, 185, 129, 0.25)'
    },
    {
      title: 'Cross-Match Job Openings',
      desc: 'Paste a target job posting description to analyze compatibility, and instantly list critical, important, or preferred technology skill gaps.',
      icon: Target,
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'rgba(245, 158, 11, 0.25)'
    },
    {
      title: 'Interactive Mock Interviews',
      desc: 'Run recruiter-style prep sessions. Tally ratings across technical accuracy, problem solving, confidence, and professional communication.',
      icon: Compass,
      color: 'from-indigo-500 to-blue-500',
      shadowColor: 'rgba(59, 130, 246, 0.25)'
    }
  ];

  const handleNext = () => {
    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('resumeiq_is_new_user', 'false');
    onClose();
  };

  const CurrentIcon = steps[activeIndex].icon;

  return (
    <div className="tutorial-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="tutorial-modal-card"
        style={{ boxShadow: `0 20px 40px -15px ${steps[activeIndex].shadowColor}` }}
      >
        {/* Floating sparkles logo background */}
        <div className="tutorial-modal-sparkles">
          <Sparkles size={160} className="text-slate-800/10" />
        </div>

        {/* Carousel Content */}
        <div className="tutorial-modal-body text-center space-y-6 z-10 relative">
          <div className="flex justify-center">
            <motion.div
              key={activeIndex}
              initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${steps[activeIndex].color} flex items-center justify-center text-white shadow-lg`}
            >
              <CurrentIcon size={28} />
            </motion.div>
          </div>

          <div className="space-y-2">
            <motion.h2
              key={`title-${activeIndex}`}
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="text-lg font-black text-slate-100 tracking-tight"
            >
              {steps[activeIndex].title}
            </motion.h2>
            <motion.p
              key={`desc-${activeIndex}`}
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 0.05 }}
              className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto"
            >
              {steps[activeIndex].desc}
            </motion.p>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-1.5 pt-6 z-10 relative">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === activeIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="tutorial-modal-footer flex items-center justify-between mt-8 pt-5 border-t border-slate-850/60 z-10 relative">
          <button
            onClick={handleFinish}
            className="text-[10px] text-slate-500 hover:text-slate-350 font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Skip Intro
          </button>

          <div className="flex items-center gap-2">
            {activeIndex > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-900/10 cursor-pointer"
            >
              {activeIndex === steps.length - 1 ? (
                <>
                  Get Started <Check size={12} />
                </>
              ) : (
                <>
                  Next <ChevronRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
