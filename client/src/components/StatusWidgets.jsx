import React from 'react';

export function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-white px-6">
      <div className="text-6xl loading-dice">🎲</div>
      <div className="text-center">
        <h2 className="font-display text-xl mb-1">
          Ludo <span className="text-accent">Online</span>
        </h2>
        <p className="text-white/50 text-sm">{label}</p>
      </div>
      {/* animated loading bar w/ shimmer sweep, no fixed "percent" claim since
          we don't actually track real load progress */}
      <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent shimmer-sweep" />
      </div>
    </div>
  );
}

export function ConnectionStatus({ connected }) {
  return (
    <div
      className={`fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium glass-panel-light
        ${connected ? 'text-emerald-300' : 'text-red-300'}`}
    >
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
      {connected ? 'Connected' : 'Reconnecting…'}
    </div>
  );
}
