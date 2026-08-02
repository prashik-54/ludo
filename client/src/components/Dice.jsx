import React, { useEffect, useRef, useState } from 'react';
import { COLOR_HEX } from '../utils/constants';
import { playDiceRoll } from '../utils/sound';

const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

export default function Dice({ value, rolling, canRoll, onRoll, turnColor }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  // Tracks whether we've already fired the roll sound for the current
  // `rolling` streak, so re-renders while rolling=true don't retrigger it.
  const soundFiredRef = useRef(false);

  useEffect(() => {
    if (rolling) {
      if (!soundFiredRef.current) {
        playDiceRoll();
        soundFiredRef.current = true;
      }
      let ticks = 0;
      const interval = setInterval(() => {
        setDisplayValue(1 + Math.floor(Math.random() * 6));
        ticks += 1;
        if (ticks > 8) clearInterval(interval);
      }, 60);
      return () => clearInterval(interval);
    }
    soundFiredRef.current = false;
    if (value) setDisplayValue(value);
    return undefined;
  }, [rolling, value]);

  const pips = PIP_LAYOUTS[displayValue] || PIP_LAYOUTS[1];

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onRoll}
        disabled={!canRoll}
        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 transition-all
          ${canRoll ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-60 cursor-not-allowed'}
          ${rolling ? 'animate-dice-roll dice-glow' : 'shadow-xl'}`}
        style={{ borderColor: turnColor ? COLOR_HEX[turnColor] : '#333' }}
        aria-label="Roll dice"
      >
        {pips.map(([top, left], i) => (
          <span
            key={i}
            className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-board-bg -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${top}%`, left: `${left}%` }}
          />
        ))}
      </button>
      <span className="text-xs text-white/60 font-body">
        {canRoll ? 'Tap to roll' : rolling ? 'Rolling…' : 'Waiting…'}
      </span>
    </div>
  );
}
