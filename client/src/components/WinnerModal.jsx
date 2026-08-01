import React from 'react';
import { COLOR_HEX } from '../utils/constants';

export default function WinnerModal({ winner, isHost, onPlayAgain, onLeave }) {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-board-panel rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-board-border animate-slide-up">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="font-display text-2xl mb-2">
          <span style={{ color: COLOR_HEX[winner.color] }}>{winner.name}</span> wins!
        </h2>
        <p className="text-white/60 mb-6 capitalize">
          Team {winner.color} got all four tokens home first.
        </p>
        <div className="flex flex-col gap-3">
          {isHost && (
            <button
              onClick={onPlayAgain}
              className="bg-accent text-board-bg font-semibold rounded-full py-3 hover:scale-105 active:scale-95 transition-transform"
            >
              Play Again
            </button>
          )}
          <button
            onClick={onLeave}
            className="bg-board-panelLight text-white rounded-full py-3 hover:scale-105 active:scale-95 transition-transform"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
