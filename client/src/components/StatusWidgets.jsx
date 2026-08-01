import React from 'react';

export function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white">
      <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      <p className="text-white/60 font-body">{label}</p>
    </div>
  );
}

export function ConnectionStatus({ connected }) {
  return (
    <div
      className={`fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
        ${connected ? 'bg-emerald-900/60 border-emerald-500/40 text-emerald-300' : 'bg-red-900/60 border-red-500/40 text-red-300'}`}
    >
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
      {connected ? 'Connected' : 'Reconnecting…'}
    </div>
  );
}
