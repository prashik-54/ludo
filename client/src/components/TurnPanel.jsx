import React from 'react';
import Dice from './Dice';
import TurnTimer from './TurnTimer';
import { COLOR_HEX } from '../utils/constants';

// Rendered in two places (see Room.jsx): as a normal panel in the desktop
// sidebar, and as a fixed bottom bar on mobile. Extracted once so the two
// never drift out of sync with each other, and so the mobile bar doesn't
// need its own copy of the turn/dice logic.
export default function TurnPanel({ game, isMyTurn, currentTurnPlayer, rolling, onRoll, compact = false }) {
  const turnText = isMyTurn ? (
    <span className="text-accent font-semibold">Your turn!</span>
  ) : (
    <>
      <span
        style={{ color: currentTurnPlayer ? COLOR_HEX[currentTurnPlayer.color] : undefined }}
        className="font-semibold"
      >
        {currentTurnPlayer?.name || '...'}
      </span>{' '}
      is playing
    </>
  );

  const hint =
    isMyTurn && game.diceRolled && game.movableTokens.length > 0
      ? 'Tap a glowing token to move it'
      : isMyTurn && game.diceRolled && game.movableTokens.length === 0
      ? 'No valid moves — passing turn…'
      : null;
  const hintClass = isMyTurn && game.movableTokens.length > 0 ? 'text-accent animate-pulse' : 'text-white/40';

  if (compact) {
    // Mobile fixed bar: everything needed for the roll-then-move loop
    // (timer, whose turn, the dice, and the "tap a token" hint) fits in one
    // slim horizontal row that's always on screen — no scrolling required
    // to roll, then scroll back up to tap a token on the board.
    return (
      <div className="flex items-center gap-3 w-full">
        <TurnTimer deadline={game.turnDeadline} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/70 truncate">{turnText}</p>
          {hint && <p className={`text-[11px] truncate ${hintClass}`}>{hint}</p>}
        </div>
        <Dice
          value={game.diceValue}
          rolling={rolling}
          canRoll={isMyTurn && !game.diceRolled}
          onRoll={onRoll}
          turnColor={currentTurnPlayer?.color}
          compact
        />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-white/60 text-center">{turnText}</p>
        <TurnTimer deadline={game.turnDeadline} />
      </div>
      <Dice
        value={game.diceValue}
        rolling={rolling}
        canRoll={isMyTurn && !game.diceRolled}
        onRoll={onRoll}
        turnColor={currentTurnPlayer?.color}
      />
      {hint && <p className={`text-xs ${hintClass}`}>{hint}</p>}
    </div>
  );
}
