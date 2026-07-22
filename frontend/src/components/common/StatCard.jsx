import React from 'react';
import Card from './Card';

export default function StatCard({ icon: Icon, title, value, description, className = '' }) {
  return (
    <Card className={`hover:border-slate-800 transition-all duration-300 group cursor-pointer ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-100 group-hover:text-indigo-400 transition-all">{value}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        {Icon && (
          <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-950/20 transition-all duration-300">
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}
