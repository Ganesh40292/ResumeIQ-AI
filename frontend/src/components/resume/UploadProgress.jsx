import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';

export default function UploadProgress({ file, status, progress, error, onCancel, onRetry, onReset }) {
  if (status === 'idle') return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-indigo-400">
            <FileText size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-sm font-bold text-slate-200 truncate pr-4">
                {file ? file.name : 'Resume File'}
              </h4>
              {status === 'uploading' && (
                <button
                  onClick={onCancel}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1 hover:bg-slate-850 rounded-lg cursor-pointer"
                  title="Cancel Upload"
                >
                  <X size={16} />
                </button>
              )}
              {(status === 'success' || status === 'error') && (
                <button
                  onClick={onReset}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-850 rounded-lg cursor-pointer"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-3">
              {file ? formatFileSize(file.size) : ''}
            </p>

            {status === 'uploading' && (
              <ProgressBar value={progress} max={100} label="Uploading..." />
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl text-xs"
              >
                <CheckCircle size={16} className="shrink-0" />
                <span>Upload successful! Your resume is ready to organize.</span>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col gap-3 text-red-400 bg-red-950/20 border border-red-900/30 p-3 rounded-xl"
              >
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span className="break-words font-medium">{error}</span>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center justify-center gap-1.5 w-fit px-3 py-1.5 rounded-lg bg-red-650 hover:bg-red-600 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} /> Retry
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
