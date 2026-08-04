import React, { useMemo } from 'react';
import {
  GRID_SIZE,
  TRACK_CELLS,
  HOME_COLUMNS,
  YARD_BLOCKS,
  YARD_SLOTS,
  isSafeTrackCell,
  resolveTokenCell,
} from '../utils/boardLayout';
import { COLOR_HEX, COLORS } from '../utils/constants';
import Token from './Token';

const YARD_TINT = {
  red: 'bg-ludo-red/90',
  green: 'bg-ludo-green/90',
  yellow: 'bg-ludo-yellow/90',
  blue: 'bg-ludo-blue/90',
};

// Marks each color's entry square onto the shared track with an arrow
// pointing in that color's direction of travel — matches the reference
// board. Derived directly from TRACK_CELLS (the same data resolveTokenCell
// uses for real movement) rather than eyeballed, so if the track layout
// ever changes these can't silently point the wrong way.
const ENTRY_ARROWS = [
  { color: 'red', cell: TRACK_CELLS[0], glyph: '→' }, // [6,1], travels rightward along row 6
  { color: 'green', cell: TRACK_CELLS[13], glyph: '↓' }, // [1,8], travels downward along col 8
  { color: 'yellow', cell: TRACK_CELLS[26], glyph: '←' }, // [8,13], travels leftward along row 8
  { color: 'blue', cell: TRACK_CELLS[39], glyph: '↑' }, // [13,6], travels upward along col 6
];

function cellKey(row, col) {
  return `${row}-${col}`;
}

export default function Board({ game, selfColor, onTokenClick }) {
  const trackCellSet = useMemo(() => {
    const map = new Map();
    TRACK_CELLS.forEach(([r, c], idx) => map.set(cellKey(r, c), idx));
    return map;
  }, []);

  const homeCellColor = useMemo(() => {
    const map = new Map();
    COLORS.forEach((color) => {
      HOME_COLUMNS[color].forEach(([r, c]) => map.set(cellKey(r, c), color));
    });
    return map;
  }, []);

  // Group tokens by the cell they currently occupy, so we can stack them
  // neatly if more than one lands on the same square.
  const tokensByCell = useMemo(() => {
    const map = new Map();
    if (!game) return map;
    COLORS.forEach((color) => {
      const tokens = game.tokens[color];
      if (!tokens) return;
      tokens.forEach((token, yardIndex) => {
        if (token.state === 'home') return; // rendered in center hub instead
        const [row, col] = resolveTokenCell(color, token.steps, yardIndex);
        const key = cellKey(row, col);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(token);
      });
    });
    return map;
  }, [game]);

  const movable = game?.movableTokens || [];
  const isMyTurn = game && game.currentTurnPlayerId && selfColor;

  const cells = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const key = cellKey(row, col);
      const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
      const inYardBlock = Object.entries(YARD_BLOCKS).find(
        ([, b]) => row >= b.rowStart && row < b.rowStart + 6 && col >= b.colStart && col < b.colStart + 6
      );

      if (inYardBlock) continue; // handled separately below

      // Every cell we DO push must be explicitly pinned to its (row, col)
      // grid position. The grid's children are built by skipping large
      // blocks (yards, most of the center) out of a plain top-left-to-
      // bottom-right scan, so relying on CSS Grid's implicit auto-placement
      // (i.e. leaving gridColumn/gridRow unset) shifts every cell after a
      // skip out of alignment — that misalignment between the background
      // squares and the tokens (which ARE positioned correctly, by percent)
      // is what makes the board look broken. Pinning position explicitly
      // fixes it regardless of which cells get skipped above.
      const gridPos = { gridColumnStart: col + 1, gridRowStart: row + 1 };

      const trackIdx = trackCellSet.get(key);
      const homeColor = homeCellColor.get(key);
      const isTrack = trackIdx !== undefined;
      const isHomeLane = homeColor !== undefined;

      // The true center hub is only the cells that belong to neither a
      // track nor a home lane — the four squares where each color's home
      // column meets the middle (e.g. red's [7,6]) are real, colored
      // squares and must still be drawn, not swallowed by the hub cutout.
      if (isCenter && !isHomeLane) continue;

      if (!isTrack && !isHomeLane) {
        cells.push(<div key={key} className="bg-board-bg" style={gridPos} />);
        continue;
      }

      const isSafe = isTrack && isSafeTrackCell(trackIdx);
      const isStart = isTrack && [0, 13, 26, 39].includes(trackIdx);
      const startColor = isStart
        ? COLORS[[0, 13, 26, 39].indexOf(trackIdx)]
        : null;

      let bg = 'bg-[#f4f1ea]';
      if (isHomeLane) bg = '';

      cells.push(
        <div
          key={key}
          className={`relative border border-black/10 flex items-center justify-center ${bg}`}
          style={{
            ...gridPos,
            ...(isHomeLane
              ? { backgroundColor: COLOR_HEX[homeColor] }
              : startColor
              ? { backgroundColor: `${COLOR_HEX[startColor]}66` }
              : undefined),
          }}
        >
          {isSafe && (
            <span
              className="text-sm sm:text-lg leading-none select-none"
              style={{
                color: '#ffffff',
                WebkitTextStroke: '1px rgba(0,0,0,0.35)',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))',
              }}
            >
              ★
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="w-full min-w-0 aspect-square max-w-[640px] mx-auto select-none">
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-board-border bg-[#f4f1ea]">
        {/* base grid of track + neutral cells */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {cells}
        </div>

        {/* yard blocks — colored backdrop only now; the dots that mark each
            token's actual resting spot are drawn separately below, in the
            SAME coordinate space real tokens use (see the comment there).
            The previous version positioned these dots via a nested CSS Grid
            local to each yard block, while actual tokens are positioned via
            percent-of-full-board — two different coordinate systems that
            didn't agree, which is why the dots and the real tokens never
            lined up. */}
        {COLORS.map((color) => {
          const b = YARD_BLOCKS[color];
          return (
            <div
              key={color}
              className={`absolute ${YARD_TINT[color]} rounded-xl m-[2%]`}
              style={{
                top: `${(b.rowStart / GRID_SIZE) * 100}%`,
                left: `${(b.colStart / GRID_SIZE) * 100}%`,
                width: `${(6 / GRID_SIZE) * 100}%`,
                height: `${(6 / GRID_SIZE) * 100}%`,
              }}
            >
              <div className="w-[78%] h-[78%] bg-[#f4f1ea] rounded-lg absolute top-[11%] left-[11%]" />
            </div>
          );
        })}

        {/* yard slot markers — drawn with the exact same
            `((row + 0.5) / GRID_SIZE) * 100` formula Token.jsx uses, off the
            same YARD_SLOTS coordinates resolveTokenCell resolves an empty
            token to. Same math, same data source as the real token — they
            can't drift apart. Sized/tinted to read as a classic die-face
            "4" dot pattern (matching the reference board), with the real
            pawn token layered on top once a token occupies that slot. */}
        {COLORS.map((color) =>
          YARD_SLOTS[color].map(([row, col], i) => (
            <div
              key={`${color}-slot-${i}`}
              className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                top: `${((row + 0.5) / GRID_SIZE) * 100}%`,
                left: `${((col + 0.5) / GRID_SIZE) * 100}%`,
                width: 'max(11%, 30px)',
                height: 'max(11%, 30px)',
                border: `3px solid ${COLOR_HEX[color]}`,
                backgroundColor: `${COLOR_HEX[color]}33`,
              }}
            />
          ))
        )}

        {/* entry-point arrows — see ENTRY_ARROWS above for how each cell/
            direction was derived. */}
        {ENTRY_ARROWS.map(({ color, cell, glyph }) => (
          <div
            key={color}
            className="absolute flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${((cell[0] + 0.5) / GRID_SIZE) * 100}%`,
              left: `${((cell[1] + 0.5) / GRID_SIZE) * 100}%`,
              width: `${(1 / GRID_SIZE) * 100}%`,
              height: `${(1 / GRID_SIZE) * 100}%`,
            }}
          >
            <span
              className="text-xs sm:text-base font-bold leading-none"
              style={{ color: COLOR_HEX[color], textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}
            >
              {glyph}
            </span>
          </div>
        ))}

        {/* center home hub — four solid triangles meeting at the middle,
            each pointing toward the edge its color's home column enters
            from. Home-lane entrances are: green=north (row6,col7),
            yellow=east (row7,col8), blue=south (row8,col7), red=west
            (row7,col6). A conic-gradient started 45deg before the top
            (`from -45deg`) puts a quadrant boundary exactly at each corner
            of the square, which is what turns the 4 quadrants into 4
            triangles filling a square (rather than a circle) — no
            rotation/clipping needed, so nothing can overflow its box. */}
        <div
          className="absolute rounded-sm shadow-inner border border-black/10"
          style={{
            top: `${(6 / GRID_SIZE) * 100}%`,
            left: `${(6 / GRID_SIZE) * 100}%`,
            width: `${(3 / GRID_SIZE) * 100}%`,
            height: `${(3 / GRID_SIZE) * 100}%`,
            background: `conic-gradient(from -45deg, ${COLOR_HEX.green} 0deg 90deg, ${COLOR_HEX.yellow} 90deg 180deg, ${COLOR_HEX.blue} 180deg 270deg, ${COLOR_HEX.red} 270deg 360deg)`,
          }}
        >
          {/* finished tokens stack here */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-[1px] p-1">
            {game &&
              COLORS.flatMap((color) =>
                (game.tokens[color] || [])
                  .filter((t) => t.state === 'home')
                  .map((t) => (
                    <div
                      key={t.id}
                      className="w-[18%] h-[18%] rounded-full border border-white/70 shadow"
                      style={{ backgroundColor: COLOR_HEX[color] }}
                    />
                  ))
              )}
          </div>
        </div>

        {/* small outward-pointing arrows at each corner of the center hub —
            a decorative flourish matching the reference board. */}
        {[
          { top: 6, left: 6, glyph: '↖' },
          { top: 6, left: 9, glyph: '↗' },
          { top: 9, left: 9, glyph: '↘' },
          { top: 9, left: 6, glyph: '↙' },
        ].map(({ top, left, glyph }) => (
          <div
            key={glyph}
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 select-none"
            style={{
              top: `${(top / GRID_SIZE) * 100}%`,
              left: `${(left / GRID_SIZE) * 100}%`,
              fontSize: 'clamp(8px, 1.6vw, 13px)',
              lineHeight: 1,
              color: 'rgba(0,0,0,0.55)',
              fontWeight: 700,
            }}
          >
            {glyph}
          </div>
        ))}

        {/* tokens on the track / home lanes / yards */}
        {game &&
          Array.from(tokensByCell.entries()).map(([key, tokens]) => {
            const [row, col] = key.split('-').map(Number);
            return tokens.map((token, i) => {
              const offset = tokens.length > 1 ? (i - (tokens.length - 1) / 2) * 9 : 0;
              const canMove = isMyTurn && movable.includes(token.id) && token.color === selfColor;
              return (
                <Token
                  key={token.id}
                  color={token.color}
                  row={row}
                  col={col}
                  offsetPct={offset}
                  highlighted={canMove}
                  onClick={canMove ? () => onTokenClick(token.id) : undefined}
                />
              );
            });
          })}

        {/* yard tokens (not yet started) rendered via same cell map since
            resolveTokenCell places them at their yard slot coordinates */}
      </div>
    </div>
  );
}
