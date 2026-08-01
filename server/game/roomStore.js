// roomStore.js — in-memory storage for all active rooms.
// No database: everything lives here for the lifetime of the server process.

const rooms = new Map();

/*
Room shape:
{
  code: 'X7KL9A',
  hostId: socketId,
  players: [ { id, name, connected, color? } ],   // join order preserved
  maxPlayers: 4,
  game: null | gameState,
  messages: [ { id, playerId, name, text, time } ],
  createdAt: Date.now(),
}
*/

function createRoom(code, host) {
  const room = {
    code,
    hostId: host.id,
    players: [{ id: host.id, name: host.name, connected: true }],
    maxPlayers: 4,
    game: null,
    messages: [],
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code);
}

function deleteRoom(code) {
  rooms.delete(code);
}

/** Remove rooms that have been empty (no connected players) for a while. */
function pruneEmptyRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  const anyoneConnected = room.players.some((p) => p.connected);
  if (!anyoneConnected) {
    rooms.delete(code);
  }
}

module.exports = { rooms, createRoom, getRoom, deleteRoom, pruneEmptyRoom };
