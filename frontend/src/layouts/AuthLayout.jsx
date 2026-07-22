import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
