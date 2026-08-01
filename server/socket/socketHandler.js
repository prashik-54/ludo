// socketHandler.js — wires Socket.IO events to the room store & game engine.
// This is the only place that mutates room/game state in response to a
// client action, so every action is validated here before broadcasting.

const { createRoom, getRoom, pruneEmptyRoom } = require('../game/roomStore');
const { generateUniqueRoomCode } = require('../utils/roomCode');
const { rooms } = require('../game/roomStore');
const {
  createGameState,
  currentPlayer,
  rollDice,
  moveToken,
  advanceTurn,
  isGameOver,
} = require('../game/gameEngine');

const PLAYER_COLORS_LABEL = ['red', 'green', 'yellow', 'blue'];

// Map a socket id -> { roomCode, name } so we can handle disconnects cleanly
// and support reconnection via a client-stored playerId.
const socketMeta = new Map();

function publicRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      color: room.game
        ? room.game.playersOrder.find((gp) => gp.id === p.id)?.color
        : undefined,
    })),
    maxPlayers: room.maxPlayers,
    started: !!room.game,
  };
}

function publicGameState(room) {
  if (!room.game) return null;
  const g = room.game;
  return {
    started: true,
    playersOrder: g.playersOrder,
    tokens: g.tokens,
    currentTurnIndex: g.currentTurnIndex,
    currentTurnPlayerId: currentPlayer(g)?.id,
    diceValue: g.diceValue,
    diceRolled: g.diceRolled,
    movableTokens: g.movableTokens,
    winner: g.winner,
    winners: g.winners,
  };
}

function broadcastRoom(io, room) {
  io.to(room.code).emit('room-state', publicRoomState(room));
  if (room.game) {
    io.to(room.code).emit('game-state', publicGameState(room));
  }
}

function initSocket(io) {
  io.on('connection', (socket) => {
    // ---------- CREATE ROOM ----------
    socket.on('create-room', ({ name }, callback) => {
      try {
        const playerName = (name || 'Player').trim().slice(0, 20) || 'Player';
        const code = generateUniqueRoomCode(rooms);
        const room = createRoom(code, { id: socket.id, name: playerName });

        socketMeta.set(socket.id, { roomCode: code, name: playerName });
        socket.join(code);

        callback?.({ ok: true, room: publicRoomState(room), selfId: socket.id });
        io.to(code).emit('room-state', publicRoomState(room));
      } catch (err) {
        callback?.({ ok: false, error: 'Could not create room.' });
      }
    });

    // ---------- JOIN ROOM ----------
    socket.on('join-room', ({ code, name }, callback) => {
      const roomCode = (code || '').trim().toUpperCase();
      const room = getRoom(roomCode);

      if (!room) {
        callback?.({ ok: false, error: 'Room not found. Check the code and try again.' });
        return;
      }
      if (room.game) {
        callback?.({ ok: false, error: 'This game has already started.' });
        return;
      }
      if (room.players.length >= room.maxPlayers) {
        callback?.({ ok: false, error: 'Room is full.' });
        return;
      }

      const playerName = (name || 'Player').trim().slice(0, 20) || 'Player';
      room.players.push({ id: socket.id, name: playerName, connected: true });
      socketMeta.set(socket.id, { roomCode, name: playerName });
      socket.join(roomCode);

      callback?.({ ok: true, room: publicRoomState(room), selfId: socket.id });
      io.to(roomCode).emit('player-joined', { id: socket.id, name: playerName });
      io.to(roomCode).emit('room-state', publicRoomState(room));
    });

    // ---------- START GAME ----------
    socket.on('start-game', (_, callback) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return callback?.({ ok: false, error: 'Not in a room.' });
      const room = getRoom(meta.roomCode);
      if (!room) return callback?.({ ok: false, error: 'Room not found.' });
      if (room.hostId !== socket.id) {
        return callback?.({ ok: false, error: 'Only the host can start the game.' });
      }
      if (room.players.length < 2) {
        return callback?.({ ok: false, error: 'Need at least 2 players to start.' });
      }
      if (room.game) {
        return callback?.({ ok: false, error: 'Game already started.' });
      }

      room.game = createGameState(room.players.map((p) => ({ id: p.id, name: p.name })));
      callback?.({ ok: true });
      broadcastRoom(io, room);
      io.to(room.code).emit('start-game');
    });

    // ---------- ROLL DICE ----------
    socket.on('roll-dice', (_, callback) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomCode);
      if (!room || !room.game) return;
      const game = room.game;

      const player = currentPlayer(game);
      if (!player || player.id !== socket.id) {
        return callback?.({ ok: false, error: 'Not your turn.' });
      }
      if (game.diceRolled) {
        return callback?.({ ok: false, error: 'You already rolled.' });
      }

      const { value, movableTokens } = rollDice(game);
      callback?.({ ok: true, value });
      io.to(room.code).emit('dice-rolled', { value, playerId: socket.id, movableTokens });
      io.to(room.code).emit('game-state', publicGameState(room));

      // No legal moves at all -> auto pass the turn after a short pause so
      // players can see the rolled number before the turn changes.
      if (movableTokens.length === 0) {
        setTimeout(() => {
          if (!room.game) return;
          advanceTurn(room.game);
          io.to(room.code).emit('next-turn', {
            currentTurnPlayerId: currentPlayer(room.game)?.id,
          });
          io.to(room.code).emit('game-state', publicGameState(room));
        }, 900);
      }
    });

    // ---------- MOVE TOKEN ----------
    socket.on('move-token', ({ tokenId }, callback) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomCode);
      if (!room || !room.game) return;
      const game = room.game;

      const player = currentPlayer(game);
      if (!player || player.id !== socket.id) {
        return callback?.({ ok: false, error: 'Not your turn.' });
      }
      if (!game.diceRolled) {
        return callback?.({ ok: false, error: 'Roll the dice first.' });
      }
      if (!game.movableTokens.includes(tokenId)) {
        return callback?.({ ok: false, error: 'That token cannot move.' });
      }

      const result = moveToken(game, player.color, tokenId);
      callback?.({ ok: true, result });
      io.to(room.code).emit('token-moved', result);

      if (isGameOver(game)) {
        io.to(room.code).emit('winner', { color: game.winner, playerId: player.id, name: player.name });
        io.to(room.code).emit('game-state', publicGameState(room));
        return;
      }

      advanceTurn(game);
      io.to(room.code).emit('next-turn', { currentTurnPlayerId: currentPlayer(game)?.id });
      io.to(room.code).emit('game-state', publicGameState(room));
    });

    // ---------- CHAT ----------
    socket.on('send-message', ({ text }) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomCode);
      if (!room) return;
      const trimmed = (text || '').trim().slice(0, 300);
      if (!trimmed) return;

      const message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerId: socket.id,
        name: meta.name,
        text: trimmed,
        time: Date.now(),
      };
      room.messages.push(message);
      if (room.messages.length > 200) room.messages.shift();
      io.to(room.code).emit('receive-message', message);
    });

    socket.on('typing', () => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      socket.to(meta.roomCode).emit('typing', { playerId: socket.id, name: meta.name });
    });

    socket.on('stop-typing', () => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      socket.to(meta.roomCode).emit('stop-typing', { playerId: socket.id });
    });

    // ---------- LEAVE ROOM ----------
    socket.on('leave-room', () => {
      handleDeparture(io, socket, false);
    });

    // ---------- PLAY AGAIN (reset room to lobby) ----------
    socket.on('play-again', (_, callback) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;
      const room = getRoom(meta.roomCode);
      if (!room) return;
      if (room.hostId !== socket.id) {
        return callback?.({ ok: false, error: 'Only the host can restart.' });
      }
      room.game = null;
      callback?.({ ok: true });
      broadcastRoom(io, room);
      io.to(room.code).emit('game-reset');
    });

    // ---------- RECONNECT ----------
    // Client stores { roomCode, playerId } in localStorage and offers it on
    // reconnect so a refresh doesn't kick the player out of an active game.
    socket.on('reconnect-room', ({ code, oldId, name }, callback) => {
      const room = getRoom((code || '').toUpperCase());
      if (!room) return callback?.({ ok: false, error: 'Room no longer exists.' });

      const existing = room.players.find((p) => p.id === oldId);
      if (!existing) return callback?.({ ok: false, error: 'Player not found in room.' });

      // Re-key the player & any game references to the new socket id.
      const newId = socket.id;
      existing.id = newId;
      existing.connected = true;
      if (room.hostId === oldId) room.hostId = newId;

      if (room.game) {
        const gp = room.game.playersOrder.find((p) => p.id === oldId);
        if (gp) gp.id = newId;
      }

      socketMeta.set(newId, { roomCode: room.code, name: existing.name });
      socket.join(room.code);

      callback?.({
        ok: true,
        room: publicRoomState(room),
        game: publicGameState(room),
        selfId: newId,
        messages: room.messages,
      });
      io.to(room.code).emit('room-state', publicRoomState(room));
      if (room.game) io.to(room.code).emit('game-state', publicGameState(room));
    });

    socket.on('get-messages', (_, callback) => {
      const meta = socketMeta.get(socket.id);
      if (!meta) return callback?.([]);
      const room = getRoom(meta.roomCode);
      callback?.(room ? room.messages : []);
    });

    socket.on('disconnect', () => {
      handleDeparture(io, socket, true);
    });
  });
}

function handleDeparture(io, socket, isDisconnect) {
  const meta = socketMeta.get(socket.id);
  if (!meta) return;
  const room = getRoom(meta.roomCode);
  socketMeta.delete(socket.id);
  if (!room) return;

  const player = room.players.find((p) => p.id === socket.id);
  if (!player) return;

  if (isDisconnect && room.game) {
    // Keep their seat & tokens intact in case they reconnect; just mark
    // them as disconnected so others can see it.
    player.connected = false;
    io.to(room.code).emit('player-left', { id: socket.id, name: player.name, temporary: true });
    io.to(room.code).emit('room-state', publicRoomState(room));
  } else {
    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.leave(room.code);
    io.to(room.code).emit('player-left', { id: socket.id, name: player.name, temporary: false });
    io.to(room.code).emit('room-state', publicRoomState(room));
  }

  pruneEmptyRoom(room.code);
}

module.exports = { initSocket };
