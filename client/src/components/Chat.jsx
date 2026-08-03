import React, { useEffect, useRef, useState } from 'react';
import socket from '../socket/socket';
import { playChat } from '../utils/sound';

export default function Chat({ selfId, open, onToggle, onOpened, raised = false }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.emit('get-messages', (msgs) => setMessages(msgs || []));

    const onReceive = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!open) setUnread((n) => n + 1);
      if (msg.playerId !== selfId) playChat();
    };
    const onTyping = ({ playerId, name }) => {
      if (playerId === selfId) return;
      setTypingUsers((prev) => new Map(prev).set(playerId, name));
    };
    const onStopTyping = ({ playerId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(playerId);
        return next;
      });
    };

    socket.on('receive-message', onReceive);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStopTyping);
    return () => {
      socket.off('receive-message', onReceive);
      socket.off('typing', onTyping);
      socket.off('stop-typing', onStopTyping);
    };
  }, [open, selfId]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [open, messages]);

  const handleChange = (e) => {
    setDraft(e.target.value);
    socket.emit('typing');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('stop-typing'), 1200);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    socket.emit('send-message', { text });
    setDraft('');
    socket.emit('stop-typing');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const typingNames = Array.from(typingUsers.values());

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={`btn-gradient fixed right-5 z-40 text-board-bg rounded-full w-14 h-14 shadow-2xl flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-transform
          ${raised ? 'bottom-24 lg:bottom-5' : 'bottom-5'}`}
        aria-label="Toggle chat"
      >
        💬
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-ludo-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-board-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <div
        className={`fixed z-40 top-0 right-0 h-full w-full sm:w-96 glass-panel border-l border-board-border shadow-2xl transition-transform duration-300 flex flex-col
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-board-border">
          <h3 className="font-display text-lg">Room Chat</h3>
          <button onClick={onToggle} className="text-white/60 hover:text-white text-xl leading-none" aria-label="Close chat">
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-white/40 text-sm text-center mt-8">No messages yet. Say hi 👋</p>
          )}
          {messages.map((m) => {
            const mine = m.playerId === selfId;
            return (
              <div key={m.id} className={`max-w-[85%] ${mine ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
                {!mine && <span className="text-[11px] text-white/40 px-1">{m.name}</span>}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm break-words animate-slide-up
                    ${mine ? 'bg-accent text-board-bg rounded-br-sm' : 'bg-board-panelLight text-white rounded-bl-sm'}`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-white/30 px-1 mt-0.5">
                  {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          {typingNames.length > 0 && (
            <div className="text-xs text-white/40 italic px-1">
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}
        </div>

        <div className="p-3 border-t border-board-border flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            maxLength={300}
            className="flex-1 bg-board-panelLight rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={sendMessage}
            disabled={!draft.trim()}
            className="btn-gradient text-board-bg rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}
