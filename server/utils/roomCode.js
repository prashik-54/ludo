// roomCode.js — generates short, human-friendly room codes.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function generateRoomCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Generate a code guaranteed not to collide with an existing rooms map. */
function generateUniqueRoomCode(rooms) {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  return code;
}

module.exports = { generateRoomCode, generateUniqueRoomCode };
