import React from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';

export default function ResumeFilters({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
  filterDefault,
  onFilterDefaultChange,
  sortBy,
  onSortByChange,
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-900 border border-slate-850 p-4 rounded-2xl w-full">
      {/* Search Input */}
      <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-850 px-3.5 py-2 rounded-xl">
        <Search size={16} className="text-slate-500 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or filename..."
          className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-600 focus:outline-none w-full"
        />
      </div>

      {/* Filter and Sort options */}
      <div className="flex flex-wrap items-center gap-3">
        {/* File Type Filter */}
        <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
          {['ALL', 'PDF', 'DOCX'].map((type) => (
            <button
              key={type}
              onClick={() => onFileTypeChange(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                fileType === type
                  ? 'bg-slate-800 text-slate-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Default Resume Toggle */}
        <button
          onClick={() => onFilterDefaultChange(!filterDefault)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterDefault
              ? 'bg-indigo-950/40 border-indigo-800/80 text-indigo-400'
              : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
          }`}
        >
          <Filter size={14} /> Default Only
        </button>

        {/* Sort Select */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl">
          <SortAsc size={14} className="text-slate-500 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-350 focus:outline-none cursor-pointer pr-4 font-semibold"
          >
            <option value="NEWEST" className="bg-slate-950">Newest Uploaded</option>
            <option value="OLDEST" className="bg-slate-950">Oldest Uploaded</option>
            <option value="ALPHABETICAL" className="bg-slate-950">Alphabetical (A-Z)</option>
            <option value="LARGEST" className="bg-slate-950">Largest File</option>
            <option value="SMALLEST" className="bg-slate-950">Smallest File</option>
          </select>
        </div>
      </div>
    </div>
  );
}
