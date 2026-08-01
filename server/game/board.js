// board.js — shared board geometry & constants used by the game engine
// The main track has 52 squares (global indices 0-51), arranged clockwise.
// Each color has a fixed entry point on that track, then peels off into its
// own private 6-square home column, then "home" (finished).

const COLORS = ['red', 'green', 'yellow', 'blue'];

// Global start square (index 0-51) for each color on the shared 52-cell ring.
const START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// The square immediately BEFORE each color's home-column turnoff.
// A token turns into its home column once its step count would carry it
// past this square.
const TURN_INDEX = {
  red: 50,
  green: 11,
  yellow: 24,
  blue: 37,
};

// Safe squares (captures cannot happen here): the four start squares plus
// the four "star" squares 8 steps ahead of each start.
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Total steps a token must take to travel from its start square to home:
// 51 squares on the main ring + 6 squares in the home column = 57.
const PATH_LENGTH = 57;
const HOME_COLUMN_LENGTH = 6;
const MAIN_TRACK_LENGTH = 51;

/**
 * Given a color and a step count (1-51, i.e. still on the main ring),
 * return the token's global square index (0-51).
 */
function globalIndexForSteps(color, steps) {
  const start = START_INDEX[color];
  return (start + steps - 1) % 52;
}

/**
 * Determine whether a given step count for a color is still on the shared
 * ring (true) or has turned into the private home column (false).
 */
function isOnMainTrack(color, steps) {
  return steps >= 1 && steps <= MAIN_TRACK_LENGTH;
}

module.exports = {
  COLORS,
  START_INDEX,
  TURN_INDEX,
  SAFE_SQUARES,
  PATH_LENGTH,
  HOME_COLUMN_LENGTH,
  MAIN_TRACK_LENGTH,
  globalIndexForSteps,
  isOnMainTrack,
};
