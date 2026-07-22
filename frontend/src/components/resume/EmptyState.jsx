import React from 'react';
import { motion } from 'framer-motion';
import { FileUp } from 'lucide-react';

export default function EmptyState({ onUploadClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-slate-850 rounded-3xl bg-slate-900/10 backdrop-blur-sm select-none"
    >
      <div className="w-20 h-20 bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        <FileUp size={36} />
      </div>

      <h3 className="text-lg font-bold text-slate-200 mb-2">No resumes found</h3>
      <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
        Upload your first resume in PDF or DOCX format to get started. You'll be able to organize, preview, version, and match jobs instantly!
      </p>

      <button
        onClick={onUploadClick}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-950/40 cursor-pointer"
      >
        <FileUp size={14} /> Upload Resume
      </button>
    </motion.div>
  );
}
