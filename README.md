# 🎲 Ludo Online

A complete real-time multiplayer Ludo game. Create a room, share a 6-character
code, and play with up to 3 friends from any device — no login, no database,
everything runs live over Socket.IO.

## Project structure

```
ludo/
├── server/                  Node.js + Express + Socket.IO backend
│   ├── index.js              entrypoint (Express app + Socket.IO server)
│   ├── socket/
│   │   └── socketHandler.js  all socket event handlers
│   ├── game/
│   │   ├── board.js          board geometry constants
│   │   ├── gameEngine.js     authoritative Ludo rules engine
│   │   └── roomStore.js      in-memory room storage
│   └── utils/
│       └── roomCode.js       room code generator
│
└── client/                  React + Vite + Tailwind frontend
    └── src/
        ├── pages/
        │   ├── Home.jsx       create/join room screen
        │   └── Room.jsx       lobby + live game screen
        ├── components/
        │   ├── Board.jsx      the Ludo board (pure CSS, no images)
        │   ├── Token.jsx      a single token/pawn
        │   ├── Dice.jsx       animated dice
        │   ├── PlayerList.jsx players + turn indicator
        │   ├── Chat.jsx       real-time side-panel chat
        │   ├── WinnerModal.jsx
        │   ├── StatusWidgets.jsx  loading screen + connection badge
        │   └── Toast.jsx      toast notification system
        ├── socket/socket.js   Socket.IO client singleton
        └── utils/             board layout + constants shared by components
```

## How the game works

- The **server is fully authoritative**. It stores each room's players,
  token positions, whose turn it is, the dice value, and chat history in
  memory (`server/game/roomStore.js`). Clients never mutate game state
  directly — they only render whatever the server broadcasts.
- Classic Ludo rules are implemented in `server/game/gameEngine.js`:
  - A 6 is required to bring a token out of the yard.
  - Rolling a 6 grants another roll; three 6's in a row forfeits the turn.
  - Landing exactly on the finish square is required to complete a token.
  - Landing on an opponent (off the 8 safe squares) sends it back to the yard.
  - The first player to get all 4 tokens home wins.
  - Supports 2, 3, or 4 players per room.
- Disconnects are handled gracefully: if a player refreshes or drops mid-game,
  their seat and tokens stay put and they're automatically re-attached to the
  room when they reconnect (`reconnect-room` event, backed by a `playerId`
  stored in `localStorage`).

## Socket events

| Event | Direction | Purpose |
|---|---|---|
| `create-room` / `join-room` | client → server | enter a room |
| `room-state` / `game-state` | server → client | full state sync |
| `start-game` | both | host starts the match |
| `roll-dice` / `dice-rolled` | both | dice turn |
| `move-token` / `token-moved` | both | token movement |
| `next-turn` | server → client | whose turn it is now |
| `winner` | server → client | game over |
| `play-again` / `game-reset` | both | restart from the lobby |
| `send-message` / `receive-message` | both | chat |
| `typing` / `stop-typing` | both | typing indicator |
| `reconnect-room` | client → server | resume session after refresh/drop |
| `player-joined` / `player-left` | server → client | roster changes |

## Running locally

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # edit CLIENT_ORIGIN if needed
npm run dev                # or: npm start
```

The server listens on `http://localhost:4000` by default.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env       # VITE_SERVER_URL=http://localhost:4000
npm run dev
```

Open `http://localhost:5173`, create a room, then open the room link in
another tab/browser/phone (on the same Wi-Fi, use your machine's LAN IP
instead of localhost) to test with a second "player".

## Deploying

### Backend → Render

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **New Web Service** pointing at
   the `server/` folder (root directory = `server`).
3. Build command: `npm install`. Start command: `npm start`.
4. Add an environment variable `CLIENT_ORIGIN` set to your deployed Vercel
   URL (comma-separate if you need more than one, e.g. also `localhost`).
5. Deploy — note the resulting URL, e.g. `https://ludo-server.onrender.com`.

### Frontend → Vercel

1. On [Vercel](https://vercel.com), import the repo and set the **root
   directory** to `client/`.
2. Framework preset: Vite.
3. Add an environment variable `VITE_SERVER_URL` set to your Render backend
   URL from above.
4. Deploy — Vercel will give you a URL like `https://ludo-online.vercel.app`.
5. Go back to Render and make sure `CLIENT_ORIGIN` matches this exact URL,
   then redeploy the backend so CORS allows it.

That's it — share the Vercel link with friends, create a room, and play.

## Notes & limitations

- State is in-memory only: restarting the backend clears all active rooms.
  This is intentional per the "no database" requirement.
- Render's free tier spins down on inactivity, which can cause a ~30s cold
  start and a brief Socket.IO reconnect on the first request of the day.
- Blocking (two tokens of the same color forming an unpassable block) is not
  implemented — every other core rule (safe squares, exact-finish, capture,
  three-sixes, 2–4 players) is.
