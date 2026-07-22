import React from 'react';

export default function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`animate-spin rounded-full border-indigo-500 border-t-transparent ${sizes[size]}`} />
  );
}
