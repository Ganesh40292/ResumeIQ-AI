import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-850 p-6 rounded-2xl shadow-xl backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
