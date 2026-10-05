import React, { useState, useEffect } from 'react';
import { ScanLine, Database } from 'lucide-react';

interface StartupSplashProps {
  onComplete: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible');

  useEffect(() => {
    // Show splash for ~1s then fade out in 200ms — total ~1.2s
    const showTimer = setTimeout(() => {
      setPhase('fading');
      const doneTimer = setTimeout(() => {
        onComplete();
      }, 250);
      return () => clearTimeout(doneTimer);
    }, 950);

    return () => clearTimeout(showTimer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-250 pointer-events-none
        ${phase === 'fading' ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-5 animate-scaleUpFast">
        {/* Logo */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-sky-500 shadow-2xl shadow-primary-900/60 border border-primary-400/30 overflow-hidden">
          <ScanLine className="w-10 h-10 text-white" />
          {/* Scan beam */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/25 to-transparent animate-scanBeam" />
        </div>

        {/* Name */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            FRAS
          </h1>
          <p className="text-sm font-semibold text-primary-400 tracking-widest uppercase">
            Face Recognition Attendance System
          </p>
        </div>

        {/* DB badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL 18</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Progress bar */}
        <div className="w-40 h-0.5 bg-slate-800 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-gradient-to-r from-primary-600 to-sky-400 rounded-full animate-[progressBar_1s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  );
};
