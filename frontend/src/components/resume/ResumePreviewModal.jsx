import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, ShieldAlert, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../common/Spinner';

export default function ResumePreviewModal({ resume, onClose, onDownload }) {
  const isDocx = resume?.originalFileName?.endsWith('.docx') || resume?.fileType?.includes('word');
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!resume || isDocx) return;

    let url = '';
    const loadPdf = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/resumes/download/${resume.id}`, {
          responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error(err);
        setError('Failed to load PDF preview. Please download the file to view.');
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (url) {
        window.URL.revokeObjectURL(url);
      }
    };
  }, [resume, isDocx]);

  if (!resume) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(resume.id);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-850 bg-slate-900/90 z-20">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDocx ? 'bg-blue-950/40 text-blue-400' : 'bg-red-950/40 text-red-400'}`}>
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 truncate w-64 md:w-96" title={resume.resumeTitle}>
                  {resume.resumeTitle}
                </h3>
                <p className="text-[10px] text-slate-500 truncate w-64 md:w-96">
                  {resume.originalFileName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 bg-slate-950 relative overflow-y-auto flex items-center justify-center p-6">
            {isDocx ? (
              <div className="max-w-md text-center flex flex-col items-center p-8 bg-slate-900 border border-slate-850 rounded-2xl shadow-lg">
                <ShieldAlert size={48} className="text-indigo-400 mb-4" />
                <h4 className="text-base font-bold text-slate-200 mb-2">DOCX Previews are unavailable</h4>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  We currently support direct in-browser rendering for PDF resumes only. You can download this DOCX file to view it on your local device.
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  <Download size={16} /> Download File
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <span className="text-xs text-slate-500 font-medium">Securing connection & loading file...</span>
              </div>
            ) : error ? (
              <div className="max-w-xs text-center flex flex-col items-center text-red-400">
                <AlertTriangle size={36} className="mb-2" />
                <p className="text-xs font-medium mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-850/80 rounded-xl text-slate-200 font-semibold text-xs transition-colors"
                >
                  Download File
                </button>
              </div>
            ) : (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-none rounded-xl bg-white"
                title="PDF Preview"
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
