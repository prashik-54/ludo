// boardLayout.js — maps the abstract game state (steps along a path) to
// concrete (row, col) coordinates on a 15x15 grid, for rendering only.
// This mirrors the server's 52-cell ring (see server/game/board.js) exactly,
// so index N here always corresponds to the same square the server means.

export const GRID_SIZE = 15;

// The 52-square shared ring, walked clockwise starting at red's entry square.
export const TRACK_CELLS = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

// Each color's private 6-square home column (step 52-57), leading into center.
export const HOME_COLUMNS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

// Four token slots inside each color's yard (corner) block.
export const YARD_SLOTS = {
  red: [[1, 1], [1, 4], [4, 1], [4, 4]],
  green: [[1, 10], [1, 13], [4, 10], [4, 13]],
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  blue: [[10, 1], [10, 4], [13, 1], [13, 4]],
};

export const YARD_BLOCKS = {
  red: { rowStart: 0, colStart: 0 },
  green: { rowStart: 0, colStart: 9 },
  yellow: { rowStart: 9, colStart: 9 },
  blue: { rowStart: 9, colStart: 0 },
};

export const CENTER = { row: 7, col: 7 };

const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

/**
 * Resolve a token's (row, col) grid position from its color and step count.
 * steps: 0 = yard, 1-51 = main track, 52-57 = home column/finished.
 */
export function resolveTokenCell(color, steps, yardIndex) {
  if (steps === 0) {
    return YARD_SLOTS[color][yardIndex] || YARD_SLOTS[color][0];
  }
  if (steps >= 1 && steps <= 51) {
    const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };
    const globalIdx = (START_INDEX[color] + steps - 1) % 52;
    return TRACK_CELLS[globalIdx];
  }
  // 52-57 -> home column index 0-5
  const homeIdx = Math.min(steps - 52, 5);
  return HOME_COLUMNS[color][homeIdx];
}

export function isSafeTrackCell(index) {
  return SAFE_TRACK_INDICES.has(index);
}
