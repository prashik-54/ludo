import React from 'react';
import { COLOR_HEX } from '../utils/constants';

export default function PlayerList({ room, game, selfId }) {
  const players = room?.players || [];

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-lg">
      <h3 className="font-display text-sm tracking-wide text-white/70 mb-3">PLAYERS</h3>
      <ul className="flex flex-col gap-2">
        {players.map((p) => {
          const gp = game?.playersOrder?.find((g) => g.id === p.id);
          const isTurn = game && game.currentTurnPlayerId === p.id;
          const isSelf = p.id === selfId;
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors
                ${isTurn ? 'bg-accent/20 ring-1 ring-accent' : 'bg-board-panelLight'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                  style={{ backgroundColor: gp ? COLOR_HEX[gp.color] : '#666' }}
                />
                <span className="truncate text-sm font-medium">
                  {p.name}
                  {isSelf && <span className="text-white/40"> (you)</span>}
                </span>
                {p.id === room.hostId && <span title="Host" className="text-accent text-xs">★</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!p.connected && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">offline</span>
                )}
                {gp?.finished && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">done</span>
                )}
                {isTurn && !gp?.finished && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-board-bg font-semibold">turn</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
