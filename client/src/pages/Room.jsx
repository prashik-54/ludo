import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socket from '../socket/socket';
import { useToast } from '../components/Toast';
import { LoadingScreen, ConnectionStatus } from '../components/StatusWidgets';
import PlayerList from '../components/PlayerList';
import Board from '../components/Board';
import Dice from '../components/Dice';
import TurnTimer from '../components/TurnTimer';
import Chat from '../components/Chat';
import WinnerModal from '../components/WinnerModal';
import { COLOR_HEX } from '../utils/constants';
import { isMuted, toggleMuted, onMuteChange, playTokenMove, playCapture, playTokenHome, playPlayerJoined, playVictory } from '../utils/sound';

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(socket.connected);
  const [room, setRoom] = useState(null);
  const [game, setGame] = useState(null);
  const [selfId, setSelfId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  const selfIdRef = useRef(selfId);
  selfIdRef.current = selfId;

  useEffect(() => onMuteChange(setMutedState), []);

  // ---- connect / reconnect handshake ----
  useEffect(() => {
    const storedId = localStorage.getItem('ludo_player_id');
    const storedName = localStorage.getItem('ludo_name') || 'Player';
    const roomCode = code.toUpperCase();

    if (!storedId) {
      navigate('/');
      return undefined;
    }

    const attempt = () => {
      socket.emit('reconnect-room', { code: roomCode, oldId: storedId, name: storedName }, (res) => {
        if (!res?.ok) {
          showToast(res?.error || 'Room not found', 'error');
          navigate('/');
          return;
        }
        setRoom(res.room);
        setGame(res.game);
        setSelfId(res.selfId);
        localStorage.setItem('ludo_player_id', res.selfId);
        setLoading(false);
      });
    };

    if (socket.connected) attempt();
    socket.on('connect', attempt);
    return () => socket.off('connect', attempt);
  }, [code, navigate, showToast]);

  // ---- connection status ----
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // ---- live game/room events ----
  useEffect(() => {
    const onRoomState = (r) => setRoom(r);
    const onGameState = (g) => setGame(g);
    const onPlayerJoined = ({ name }) => {
      showToast(`${name} joined the room`, 'info');
      playPlayerJoined();
    };
    const onPlayerLeft = ({ name, temporary }) =>
      showToast(temporary ? `${name} disconnected` : `${name} left the room`, 'info');
    const onStartGame = () => showToast('Game started! 🎲', 'success');
    const onDiceRolled = ({ value }) => {
      setRolling(true);
      setTimeout(() => setRolling(false), 500);
    };
    const onTokenMoved = (result) => {
      if (result.captured?.length) {
        result.captured.forEach((c) => showToast(`${c.color} token was captured!`, 'info'));
        playCapture();
      } else {
        playTokenMove();
      }
      if (result.finished) {
        showToast('A token reached home! 🏠', 'success');
        playTokenHome();
      }
    };
    // Server-authoritative turn changes (see socketHandler.js). We only care
    // about the `timedOut` flag here for a toast — the actual new turn state
    // arrives via the `game-state` broadcast that always follows this event.
    const onNextTurn = ({ timedOut }) => {
      if (timedOut) showToast("Time's up — turn passed", 'info');
    };
    const onWinner = (info) => {
      setWinnerInfo(info);
      playVictory();
    };
    const onGameReset = () => {
      setWinnerInfo(null);
      showToast('Back to the lobby', 'info');
    };

    socket.on('room-state', onRoomState);
    socket.on('game-state', onGameState);
    socket.on('player-joined', onPlayerJoined);
    socket.on('player-left', onPlayerLeft);
    socket.on('start-game', onStartGame);
    socket.on('dice-rolled', onDiceRolled);
    socket.on('token-moved', onTokenMoved);
    socket.on('next-turn', onNextTurn);
    socket.on('winner', onWinner);
    socket.on('game-reset', onGameReset);

    return () => {
      socket.off('room-state', onRoomState);
      socket.off('game-state', onGameState);
      socket.off('player-joined', onPlayerJoined);
      socket.off('player-left', onPlayerLeft);
      socket.off('start-game', onStartGame);
      socket.off('dice-rolled', onDiceRolled);
      socket.off('token-moved', onTokenMoved);
      socket.off('next-turn', onNextTurn);
      socket.off('winner', onWinner);
      socket.off('game-reset', onGameReset);
    };
  }, [showToast]);

  const handleStart = useCallback(() => {
    socket.emit('start-game', {}, (res) => {
      if (!res?.ok) showToast(res?.error || 'Could not start game', 'error');
    });
  }, [showToast]);

  const handleRoll = useCallback(() => {
    setRolling(true);
    socket.emit('roll-dice', {}, (res) => {
      if (!res?.ok) {
        setRolling(false);
        showToast(res?.error || 'Could not roll', 'error');
      }
    });
  }, [showToast]);

  const handleTokenClick = useCallback(
    (tokenId) => {
      socket.emit('move-token', { tokenId }, (res) => {
        if (!res?.ok) showToast(res?.error || 'Invalid move', 'error');
      });
    },
    [showToast]
  );

  const handleLeave = useCallback(() => {
    socket.emit('leave-room');
    localStorage.removeItem('ludo_player_id');
    localStorage.removeItem('ludo_room_code');
    navigate('/');
  }, [navigate]);

  const handlePlayAgain = useCallback(() => {
    socket.emit('play-again', {}, (res) => {
      if (!res?.ok) showToast(res?.error || 'Could not restart', 'error');
    });
  }, [showToast]);

  const copyCode = () => {
    navigator.clipboard?.writeText(code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareRoom = async () => {
    const url = `${window.location.origin}/room/${code.toUpperCase()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my Ludo game', text: `Join my Ludo room with code ${code.toUpperCase()}`, url });
      } catch {
        /* user cancelled share — ignore */
      }
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Room link copied to clipboard', 'success');
    }
  };

  if (loading || !room) return <LoadingScreen label="Joining room…" />;

  const isHost = room.hostId === selfId;
  const selfPlayer = game?.playersOrder?.find((p) => p.id === selfId);
  const selfColor = selfPlayer?.color;
  const isMyTurn = game && game.currentTurnPlayerId === selfId;
  const currentTurnPlayer = game?.playersOrder?.find((p) => p.id === game.currentTurnPlayerId);

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <ConnectionStatus connected={connected} />

      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-2xl sm:text-3xl">
            Ludo <span className="text-accent">Online</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleMuted()}
              className="glass-panel-light rounded-full w-9 h-9 flex items-center justify-center text-sm hover:brightness-125 transition-all"
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              title={muted ? 'Unmute sound' : 'Mute sound'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={copyCode}
              className="glass-panel-light rounded-full px-4 py-2 text-sm font-mono tracking-widest hover:brightness-125 transition-all"
            >
              {copied ? 'Copied!' : code.toUpperCase()}
            </button>
            <button
              onClick={shareRoom}
              className="glass-panel-light rounded-full px-4 py-2 text-sm hover:brightness-125 transition-all"
            >
              Share
            </button>
            <button
              onClick={handleLeave}
              className="bg-red-900/40 border border-red-500/30 text-red-300 rounded-full px-4 py-2 text-sm hover:bg-red-900/60 transition-colors"
            >
              Leave
            </button>
          </div>
        </div>

        {!game?.started ? (
          // ---------------- LOBBY ----------------
          <div className="grid sm:grid-cols-[1fr_320px] gap-6">
            <div className="glass-panel rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4">
              <div className="text-5xl animate-bounce">🕹️</div>
              <h2 className="font-display text-2xl">Waiting for players…</h2>
              <p className="text-white/50 max-w-sm">
                Share the room code <span className="font-mono text-accent">{code.toUpperCase()}</span> with friends.
                2–4 players needed to start.
              </p>
              {isHost ? (
                <button
                  onClick={handleStart}
                  disabled={room.players.length < 2}
                  className="mt-2 btn-gradient text-board-bg font-semibold rounded-full px-8 py-3 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100"
                >
                  {room.players.length < 2 ? 'Need at least 2 players' : `Start Game (${room.players.length})`}
                </button>
              ) : (
                <p className="text-white/40 text-sm mt-2">Waiting for the host to start the game…</p>
              )}
            </div>
            <PlayerList room={room} game={game} selfId={selfId} />
          </div>
        ) : (
          // ---------------- GAME ----------------
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            <div className="flex flex-col gap-4 order-2 lg:order-1">
              <PlayerList room={room} game={game} selfId={selfId} />
              <div className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-white/60 text-center">
                    {isMyTurn ? (
                      <span className="text-accent font-semibold">Your turn!</span>
                    ) : (
                      <>
                        <span style={{ color: currentTurnPlayer ? COLOR_HEX[currentTurnPlayer.color] : undefined }} className="font-semibold">
                          {currentTurnPlayer?.name || '...'}
                        </span>{' '}
                        is playing
                      </>
                    )}
                  </p>
                  <TurnTimer deadline={game.turnDeadline} />
                </div>
                <Dice
                  value={game.diceValue}
                  rolling={rolling}
                  canRoll={isMyTurn && !game.diceRolled}
                  onRoll={handleRoll}
                  turnColor={currentTurnPlayer?.color}
                />
                {isMyTurn && game.diceRolled && game.movableTokens.length > 0 && (
                  <p className="text-xs text-accent animate-pulse">Tap a glowing token to move it</p>
                )}
                {isMyTurn && game.diceRolled && game.movableTokens.length === 0 && (
                  <p className="text-xs text-white/40">No valid moves — passing turn…</p>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Board game={game} selfColor={isMyTurn ? selfColor : null} onTokenClick={handleTokenClick} />
            </div>
          </div>
        )}
      </div>

      <Chat selfId={selfId} open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />

      <WinnerModal
        winner={winnerInfo}
        isHost={isHost}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeave}
      />

      <footer className="text-center text-white/20 text-xs mt-10">Made with ❤️</footer>
    </div>
  );
}
