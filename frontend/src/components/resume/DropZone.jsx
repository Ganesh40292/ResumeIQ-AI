import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Upload } from 'lucide-react';

export default function DropZone({ onFileSelect, disabled }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <motion.div
      className={`relative w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all text-center cursor-pointer backdrop-blur-xl ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-950/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-[1.01]'
          : 'border-white/10 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900/70 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={!disabled ? onButtonClick : undefined}
      whileHover={!disabled ? { scale: 1.005 } : {}}
      whileTap={!disabled ? { scale: 0.995 } : {}}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleChange}
        disabled={disabled}
      />

      <motion.div
        className="p-4 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 mb-4"
        animate={isDragActive ? { y: [0, -8, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <UploadCloud size={40} />
      </motion.div>

      <h3 className="text-lg font-bold text-slate-200 mb-1">
        {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
      </h3>
      <p className="text-sm text-slate-400 mb-4 max-w-md">
        or click to <span className="text-indigo-400 font-semibold hover:underline">browse your files</span>
      </p>

      <div className="flex items-center gap-6 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">
          <FileText size={14} className="text-indigo-400" /> PDF or DOCX
        </span>
        <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">
          <Upload size={14} className="text-indigo-400" /> Max 5 MB
        </span>
      </div>
    </motion.div>
  );
}
