'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'PROCESSING...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200 px-6 py-5 shadow-2xl flex flex-col items-center gap-3.5 max-w-xs text-center">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
        </div>
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-800">
          {message}
        </span>
      </div>
    </div>
  );
}
