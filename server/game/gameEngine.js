// gameEngine.js — authoritative, server-side Ludo rules engine.
// Nothing here trusts the client. Every function mutates a room's `game`
// state object and returns plain data the socket layer can broadcast.

const {
  COLORS,
  SAFE_SQUARES,
  PATH_LENGTH,
  MAIN_TRACK_LENGTH,
  globalIndexForSteps,
} = require('./board');

const TOKENS_PER_PLAYER = 4;

/**
 * Which colors get assigned, and in what seating order, based on player
 * count. For 2 players this deliberately does NOT just take the first two
 * entries of COLORS — red and green are adjacent corners on the board
 * (top-left / top-right), which is an unfair, cramped layout for a 2-player
 * game. Red and yellow sit diagonally opposite each other, matching how a
 * physical Ludo board is normally set up for two players.
 */
function pickColors(playerCount) {
  if (playerCount === 2) return ['red', 'yellow'];
  return COLORS.slice(0, playerCount);
}

/**
 * Build a brand-new game state for a room once the host starts the game.
 * players: array of { id, name } in join order.
 */
function createGameState(players) {
  const colors = pickColors(players.length);

  const tokens = {};
  players.forEach((p, idx) => {
    const color = colors[idx];
    tokens[color] = Array.from({ length: TOKENS_PER_PLAYER }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      steps: 0, // 0 = in yard, 1-51 = main track, 52-57 = home column/finished
      state: 'yard', // 'yard' | 'active' | 'home'
    }));
  });

  return {
    started: true,
    playersOrder: players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      color: colors[idx],
      finished: false,
    })),
    tokens,
    currentTurnIndex: 0,
    diceValue: null,
    diceRolled: false,
    consecutiveSixes: 0,
    movableTokens: [],
    winner: null,
    winners: [],
    log: [],
  };
}

function currentPlayer(game) {
  return game.playersOrder[game.currentTurnIndex];
}

/** Roll the die for the current player. Returns { value, movableTokens }. */
function rollDice(game) {
  const value = 1 + Math.floor(Math.random() * 6);
  game.diceValue = value;
  game.diceRolled = true;

  if (value === 6) {
    game.consecutiveSixes += 1;
  } else {
    game.consecutiveSixes = 0;
  }

  const player = currentPlayer(game);
  const movable = getMovableTokens(game, player.color, value);
  game.movableTokens = movable;

  return { value, movableTokens: movable };
}

/** Which of a color's tokens can legally move given a dice value. */
function getMovableTokens(game, color, diceValue) {
  const tokens = game.tokens[color];
  const movable = [];

  tokens.forEach((token) => {
    if (token.state === 'home') return; // already finished

    if (token.state === 'yard') {
      if (diceValue === 6) movable.push(token.id);
      return;
    }

    // active token: can move if it doesn't overshoot the finish
    const newSteps = token.steps + diceValue;
    if (newSteps <= PATH_LENGTH) {
      movable.push(token.id);
    }
  });

  return movable;
}

/**
 * Move a token. Assumes the move was already validated as legal
 * (tokenId is in game.movableTokens). Returns a result object describing
 * what happened (for animation / toast purposes on the client).
 */
function moveToken(game, color, tokenId) {
  const token = game.tokens[color].find((t) => t.id === tokenId);
  const diceValue = game.diceValue;
  const result = { color, tokenId, captured: [], finished: false, wonGame: false };

  if (token.state === 'yard') {
    token.steps = 1;
    token.state = 'active';
  } else {
    token.steps += diceValue;
    if (token.steps === PATH_LENGTH) {
      token.state = 'home';
      result.finished = true;
    } else {
      token.state = 'active';
    }
  }
  result.newSteps = token.steps;
  result.newState = token.state;

  // Capture logic: only relevant while the token is still on the shared ring.
  if (token.state === 'active' && token.steps >= 1 && token.steps <= MAIN_TRACK_LENGTH) {
    const globalIdx = globalIndexForSteps(color, token.steps);
    if (!SAFE_SQUARES.has(globalIdx)) {
      COLORS.forEach((otherColor) => {
        if (otherColor === color || !game.tokens[otherColor]) return;
        game.tokens[otherColor].forEach((otherToken) => {
          if (otherToken.state !== 'active') return;
          if (otherToken.steps < 1 || otherToken.steps > MAIN_TRACK_LENGTH) return;
          const otherGlobalIdx = globalIndexForSteps(otherColor, otherToken.steps);
          if (otherGlobalIdx === globalIdx) {
            otherToken.steps = 0;
            otherToken.state = 'yard';
            result.captured.push({ color: otherColor, tokenId: otherToken.id });
          }
        });
      });
    }
  }

  // Check whether this player has finished all 4 tokens.
  const playerEntry = game.playersOrder.find((p) => p.color === color);
  const allHome = game.tokens[color].every((t) => t.state === 'home');
  if (allHome && playerEntry && !playerEntry.finished) {
    playerEntry.finished = true;
    game.winners.push(color);
    result.wonGame = true;
    if (!game.winner) {
      game.winner = color; // first to finish is the declared winner
    }
  }

  return result;
}

/**
 * Decide whether the current player gets to go again (rolled a 6, and it's
 * not their 3rd consecutive 6) or whether the turn passes to the next
 * active player.
 */
function advanceTurn(game) {
  const bustedThreeSixes = game.consecutiveSixes >= 3;
  const rolledSix = game.diceValue === 6 && !bustedThreeSixes;

  if (bustedThreeSixes) {
    game.consecutiveSixes = 0;
  }

  if (!rolledSix) {
    moveToNextPlayer(game);
  }

  game.diceValue = null;
  game.diceRolled = false;
  game.movableTokens = [];
}

function moveToNextPlayer(game) {
  const total = game.playersOrder.length;
  let next = game.currentTurnIndex;
  for (let i = 0; i < total; i += 1) {
    next = (next + 1) % total;
    if (!game.playersOrder[next].finished) {
      game.currentTurnIndex = next;
      return;
    }
  }
  // everyone finished (shouldn't normally happen since game ends at first winner)
  game.currentTurnIndex = next;
}

/** True once a single player has finished all 4 tokens. */
function isGameOver(game) {
  return !!game.winner;
}

module.exports = {
  createGameState,
  currentPlayer,
  rollDice,
  getMovableTokens,
  moveToken,
  advanceTurn,
  moveToNextPlayer,
  isGameOver,
};
