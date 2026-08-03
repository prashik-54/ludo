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
      aria-label={`${color} token`}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent border-0 p-0 flex items-center justify-center
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        top: `calc(${topPct}% + ${offsetPct * 0.3}px)`,
        left: `calc(${leftPct}% + ${offsetPct * 0.3}px)`,
        // Animate the actual position (top/left) when a token moves to a new
        // cell, plus a slight overshoot easing so it "settles" into place.
        transition: 'top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        // The tappable hit area is deliberately larger than the visible dot
        // (min 34px, well above the old 14px) — small circular touch targets
        // are the single biggest reason token-tapping felt unreliable on
        // phones. The VISUAL dot (below) still scales proportionally with
        // the board so it doesn't look oversized on larger screens.
        width: 'max(6.2%, 34px)',
        height: 'max(6.2%, 34px)',
        zIndex: highlighted ? 30 : 20,
      }}
    >
      <span
        className={`relative block transition-transform duration-150 ease-out ${onClick ? 'hover:scale-110 active:scale-95' : ''}`}
        style={{
          width: '82%',
          height: '82%',
          animation: highlighted ? 'pulse-ring 1.2s infinite' : undefined,
          borderRadius: '9999px',
        }}
      >
        {/* base "collar" — sits slightly below/behind the head, giving the
            token a standing pawn silhouette instead of a flat dot. */}
        <span
          className="absolute rounded-full animate-token-pop"
          style={{
            bottom: 0,
            left: '8%',
            width: '84%',
            height: '46%',
            backgroundColor: COLOR_HEX_DARK[color],
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        />
        {/* head */}
        <span
          className="absolute rounded-full animate-token-pop"
          style={{
            top: 0,
            left: '10%',
            width: '80%',
            height: '80%',
            backgroundColor: COLOR_HEX[color],
            border: `2px solid ${COLOR_HEX_DARK[color]}`,
            boxShadow: highlighted
              ? `0 0 0 4px ${COLOR_HEX[color]}55, 0 2px 5px rgba(0,0,0,0.4)`
              : '0 2px 4px rgba(0,0,0,0.35)',
          }}
        >
          <span
            className="block w-full h-full rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)' }}
          />
        </span>
      </span>
    </button>
  );
}
