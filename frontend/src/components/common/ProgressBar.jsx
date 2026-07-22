import React from 'react';

export default function ProgressBar({ value, max = 100, label = '' }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #6366f1, #818cf8, #6366f1)',
            backgroundSize: '200% 100%',
            animation: percentage < 100 ? 'shimmer 1.5s ease-in-out infinite' : 'none',
            boxShadow: percentage < 100 ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
          }}
        >
          {percentage < 100 && (
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 12px)',
                animation: 'stripes 0.8s linear infinite',
              }}
            />
          )}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }
        @keyframes stripes {
          0% { background-position: 0 0; }
          100% { background-position: 17px 0; }
        }
      `}</style>
    </div>
  );
}

