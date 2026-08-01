import React from 'react';
import { GRID_SIZE } from '../utils/boardLayout';
import { COLOR_HEX, COLOR_HEX_DARK } from '../utils/constants';

export default function Token({ color, row, col, offsetPct = 0, highlighted, onClick }) {
  const topPct = ((row + 0.5) / GRID_SIZE) * 100;
  const leftPct = ((col + 0.5) / GRID_SIZE) * 100;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md animate-token-pop
        ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
      style={{
        top: `calc(${topPct}% + ${offsetPct * 0.3}px)`,
        left: `calc(${leftPct}% + ${offsetPct * 0.3}px)`,
        // Animate the actual position (top/left) when a token moves to a new
        // cell, plus a slight overshoot easing so it "settles" into place —
        // not just transform (which only covered the hover/press scale).
        transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.15s ease-out, box-shadow 0.2s ease',
        width: '6.2%',
        height: '6.2%',
        minWidth: 14,
        minHeight: 14,
        backgroundColor: COLOR_HEX[color],
        border: `2px solid ${COLOR_HEX_DARK[color]}`,
        zIndex: highlighted ? 30 : 20,
        boxShadow: highlighted
          ? `0 0 0 4px ${COLOR_HEX[color]}55, 0 2px 6px rgba(0,0,0,0.4)`
          : '0 2px 4px rgba(0,0,0,0.35)',
        animation: highlighted ? 'pulse-ring 1.2s infinite' : undefined,
      }}
      aria-label={`${color} token`}
    >
      <span className="block w-full h-full rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
    </button>
  );
}
