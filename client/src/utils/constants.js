// constants.js — client-side mirrors of the server's board geometry, used
// ONLY for rendering. The server remains the sole source of truth for state.

export const COLORS = ['red', 'green', 'yellow', 'blue'];

export const COLOR_HEX = {
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
};

export const COLOR_HEX_DARK = {
  red: '#b91c1c',
  green: '#15803d',
  yellow: '#a16207',
  blue: '#1d4ed8',
};

export const START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const MAIN_TRACK_LENGTH = 51;
export const PATH_LENGTH = 57;

export function globalIndexForSteps(color, steps) {
  const start = START_INDEX[color];
  return (start + steps - 1) % 52;
}
