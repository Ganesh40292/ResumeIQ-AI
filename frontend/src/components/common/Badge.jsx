import React from 'react';

export default function Badge({ children, variant = 'info' }) {
  const styles = {
    info: 'bg-indigo-950/50 text-indigo-400 border border-indigo-800/50',
    success: 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50',
    warning: 'bg-amber-950/50 text-amber-400 border border-amber-800/50',
    danger: 'bg-red-950/50 text-red-400 border border-red-800/50'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
}
