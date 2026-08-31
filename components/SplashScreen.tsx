'use client';

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  isLoading: boolean;
  onFinish?: () => void;
}

export function SplashScreen({ isLoading, onFinish }: SplashScreenProps) {
  const [mounted, setMounted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Show splash for minimum 1.2s for smooth cold start feel
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        setMounted(false);
        onFinish?.();
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [isLoading, minTimeElapsed, onFinish]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-[#fafaf9] px-6 py-12 select-none transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 3rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 3rem)',
      }}
    >
      <div />

      {/* Center Branding Monogram */}
      <div className="flex flex-col items-center gap-6">
        {/* Animated Brand Emblem (Pure CSS & SVG) */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Pulse Ring */}
          <div className="absolute -inset-3 rounded-2xl bg-zinc-200/60 animate-ping duration-1000 opacity-25" />

          {/* Main Logo Container */}
          <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 shadow-xl border border-zinc-800 flex items-center justify-center text-white">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              <circle cx="18" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="font-bold text-xl sm:text-2xl text-zinc-900 tracking-tight font-sans">
            Money Tracker
          </h1>
          <p className="font-mono text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-[0.25em] uppercase">
            Precision Financial Ledger
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="flex flex-col items-center gap-3 w-full max-w-[180px]">
        <div className="w-full h-1 rounded-full bg-zinc-200 overflow-hidden relative">
          <div className="h-full bg-zinc-900 rounded-full animate-indeterminate" />
        </div>
        <span className="font-mono text-[10px] text-zinc-400 tracking-wider font-medium">
          INITIALIZING...
        </span>
      </div>

      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(0%) scaleX(0.7); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
        .animate-indeterminate {
          animation: indeterminate 1.4s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
          transform-origin: 0% 50%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
