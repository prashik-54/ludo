import React, { useEffect, useState } from 'react';

const SIZE = 52;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Purely a display of `game.turnDeadline`, a timestamp the SERVER already
// committed to (see server/socket/socketHandler.js: startTurnTimer /
// handleTurnTimeout). This component never decides when a turn times out —
// it only counts down toward that shared deadline — so every connected
// client renders the same countdown regardless of their own latency, and
// the actual forfeit-on-timeout logic stays authoritative on the server.
export default function TurnTimer({ deadline, durationMs = 20000 }) {
  const [remaining, setRemaining] = useState(() => (deadline ? Math.max(0, deadline - Date.now()) : durationMs));

  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  const fraction = Math.max(0, Math.min(1, remaining / durationMs));
  const seconds = Math.ceil(remaining / 1000);
  const urgent = seconds <= 5;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: SIZE, height: SIZE }}
      role="timer"
      aria-label={`${seconds} seconds left this turn`}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE} fill="none" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={urgent ? '#ef4444' : '#f2a341'}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className={`absolute text-sm font-display font-semibold ${urgent ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>
        {seconds}
      </span>
    </div>
  );
}
