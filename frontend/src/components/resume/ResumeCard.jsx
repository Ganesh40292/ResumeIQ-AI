import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MoreVertical, Eye, Download, Edit2, Trash2, CheckCircle, FileCode, Calendar, HardDrive, BarChart3 } from 'lucide-react';
import Badge from '../common/Badge';

export default function ResumeCard({ resume, onPreview, onDownload, onRename, onDelete, onSetDefault }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDocx = resume.fileType?.includes('word') || resume.originalFileName?.endsWith('.docx');

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between h-48 transition-colors select-none ${
        resume.isDefaultResume ? 'border-indigo-650 bg-slate-900/80 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'border-slate-850 hover:border-slate-800'
      }`}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isDocx
              ? 'bg-blue-950/40 border-blue-900/30 text-blue-400'
              : 'bg-red-950/40 border-red-900/30 text-red-400'
          }`}>
            {isDocx ? <FileCode size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 truncate w-36 hover:text-indigo-400 transition-colors" title={resume.resumeTitle}>
              {resume.resumeTitle}
            </h4>
            <p className="text-[10px] text-slate-400 truncate w-36" title={resume.originalFileName}>
              {resume.originalFileName}
            </p>
          </div>
        </div>

        {/* Quick Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2.5 w-44 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <button
                  onClick={() => { onPreview(resume); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-350 hover:text-slate-100 hover:bg-slate-900 rounded-lg text-left cursor-pointer"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => { onDownload(resume.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-350 hover:text-slate-100 hover:bg-slate-900 rounded-lg text-left cursor-pointer"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => { onRename(resume); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-350 hover:text-slate-100 hover:bg-slate-900 rounded-lg text-left cursor-pointer"
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button
                  onClick={() => { navigate('/ats-report'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 rounded-lg text-left cursor-pointer"
                >
                  <BarChart3 size={14} /> View Analysis
                </button>
                {!resume.isDefaultResume && (
                  <button
                    onClick={() => { onSetDefault(resume.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 rounded-lg text-left cursor-pointer"
                  >
                    <CheckCircle size={14} /> Make Default
                  </button>
                )}
                <div className="border-t border-slate-900 my-1" />
                <button
                  onClick={() => { onDelete(resume.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-red-400 hover:bg-red-950/20 rounded-lg text-left cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center metadata */}
      <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-450 border-t border-slate-850/50 pt-3 mt-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-slate-500" />
          <span>{formatDate(resume.uploadDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive size={12} className="text-slate-500" />
          <span>{formatFileSize(resume.fileSize)}</span>
        </div>
      </div>

      {/* Bottom row actions */}
      <div className="flex items-center justify-between border-t border-slate-850/50 pt-3 mt-3">
        <div className="flex items-center gap-2">
          {resume.isDefaultResume && (
            <Badge variant="success">Default</Badge>
          )}
          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full text-slate-500 border border-slate-850 font-bold uppercase">
            v{resume.resumeVersion || 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview(resume)}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
            title="Preview Resume"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onDownload(resume.id)}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
            title="Download Resume"
          >
            <Download size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
