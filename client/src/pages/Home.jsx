import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket/socket';
import { useToast } from '../components/Toast';

const NAME_KEY = 'ludo_name';

export default function Home() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [mode, setMode] = useState('home'); // 'home' | 'create' | 'join'
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const persistAndGo = (roomCode, selfId) => {
    localStorage.setItem(NAME_KEY, name.trim() || 'Player');
    localStorage.setItem('ludo_player_id', selfId);
    localStorage.setItem('ludo_room_code', roomCode);
    navigate(`/room/${roomCode}`);
  };

  const handleCreate = () => {
    if (!name.trim()) return showToast('Enter your name first', 'error');
    setBusy(true);
    socket.emit('create-room', { name: name.trim() }, (res) => {
      setBusy(false);
      if (!res?.ok) return showToast(res?.error || 'Could not create room', 'error');
      persistAndGo(res.room.code, res.selfId);
    });
  };

  const handleJoin = () => {
    if (!name.trim()) return showToast('Enter your name first', 'error');
    if (!code.trim()) return showToast('Enter a room code', 'error');
    setBusy(true);
    socket.emit('join-room', { code: code.trim().toUpperCase(), name: name.trim() }, (res) => {
      setBusy(false);
      if (!res?.ok) return showToast(res?.error || 'Could not join room', 'error');
      persistAndGo(res.room.code, res.selfId);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-3">🎲</div>
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight mb-2">
          Ludo <span className="text-accent">Online</span>
        </h1>
        <p className="text-white/50 mb-10">Create a room, share the code, and play with friends in real time.</p>

        <div className="bg-board-panel border border-board-border rounded-3xl p-6 shadow-2xl">
          <label className="block text-left text-xs uppercase tracking-wide text-white/40 mb-1.5">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="e.g. Alex"
            className="w-full bg-board-panelLight rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent mb-5"
          />

          {mode === 'home' && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode('create')}
                className="bg-accent text-board-bg font-semibold rounded-xl py-3 hover:scale-[1.02] active:scale-95 transition-transform"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="bg-board-panelLight text-white font-semibold rounded-xl py-3 hover:scale-[1.02] active:scale-95 transition-transform"
              >
                Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="flex flex-col gap-3 animate-slide-up">
              <p className="text-sm text-white/50 text-left">
                You'll get a room code to share with up to 3 friends.
              </p>
              <button
                onClick={handleCreate}
                disabled={busy}
                className="bg-accent text-board-bg font-semibold rounded-xl py-3 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
              >
                {busy ? 'Creating…' : 'Create Room'}
              </button>
              <button onClick={() => setMode('home')} className="text-white/40 text-sm hover:text-white">
                ← Back
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="flex flex-col gap-3 animate-slide-up">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ROOM CODE"
                className="w-full bg-board-panelLight rounded-xl px-4 py-3 text-center tracking-[0.3em] font-display uppercase outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleJoin}
                disabled={busy}
                className="bg-accent text-board-bg font-semibold rounded-xl py-3 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
              >
                {busy ? 'Joining…' : 'Join Room'}
              </button>
              <button onClick={() => setMode('home')} className="text-white/40 text-sm hover:text-white">
                ← Back
              </button>
            </div>
          )}
        </div>

        <p className="text-white/30 text-sm mt-10">Made with ❤️</p>
      </div>
    </div>
  );
}
