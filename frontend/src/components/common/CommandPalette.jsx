import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, FileUp, FileCheck, Award, Target, FileSignature,
  Bot, GraduationCap, History, User, Settings, Sun, Moon, Sparkles, X
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import './CommandPalette.css';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  const commands = [
    { name: 'Go to Dashboard', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Upload New Resume', path: '/upload', icon: FileUp, category: 'Navigation' },
    { name: 'View Resume Analysis', path: '/analysis', icon: FileCheck, category: 'Navigation' },
    { name: 'View ATS Compatibility Report', path: '/ats', icon: Award, category: 'Navigation' },
    { name: 'Open Job Matcher', path: '/job-matcher', icon: Target, category: 'Navigation' },
    { name: 'Open Resume Builder', path: '/builder', icon: FileSignature, category: 'Navigation' },
    { name: 'Start AI Review Feedback', path: '/ai-review', icon: Bot, category: 'Navigation' },
    { name: 'Practice Interview Prep', path: '/interview-prep', icon: GraduationCap, category: 'Navigation' },
    { name: 'View Activity History', path: '/history', icon: History, category: 'Navigation' },
    { name: 'View Profile details', path: '/profile', icon: User, category: 'Account' },
    { name: 'Open System Settings', path: '/settings', icon: Settings, category: 'Account' },
    {
      name: 'Toggle Light/Dark Theme',
      action: () => toggleTheme(),
      icon: theme === 'dark' ? Sun : Moon,
      category: 'Preferences'
    },
    {
      name: 'Replay Welcome 3D Intro',
      action: () => {
        sessionStorage.removeItem('resumeiq_welcome_shown');
        navigate('/');
      },
      icon: Sparkles,
      category: 'Preferences'
    }
  ];

  // Filter commands by search text
  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keycap listener for toggle open state
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside listener to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation within list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const executeCommand = (cmd) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action) {
      cmd.action();
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay">
      <div className="command-palette-modal" ref={modalRef}>
        {/* Search header bar */}
        <div className="command-palette-header">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search shortcut..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="command-palette-input"
          />
          <button onClick={() => setIsOpen(false)} className="command-palette-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Results list */}
        <div className="command-palette-results">
          {filteredCommands.length > 0 ? (
            <div className="space-y-4">
              {/* Grouped lists */}
              {['Navigation', 'Account', 'Preferences'].map(cat => {
                const catCmds = filteredCommands.filter(c => c.category === cat);
                if (catCmds.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="command-palette-category-title">{cat}</div>
                    {catCmds.map(cmd => {
                      const absoluteIndex = filteredCommands.indexOf(cmd);
                      const isSelected = absoluteIndex === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <div
                          key={cmd.name}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                          className={`command-palette-item ${isSelected ? 'active' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} className={`command-palette-icon ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span className="text-xs font-medium">{cmd.name}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 font-bold uppercase tracking-wider">
                              Press ⏎
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="command-palette-empty text-center py-8 space-y-2">
              <span className="text-xs text-slate-500 font-medium">No commands found matching "{search}"</span>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="command-palette-footer">
          <div className="flex items-center gap-1.5">
            <kbd className="command-palette-kbd">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="command-palette-kbd">⏎</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="command-palette-kbd">esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
