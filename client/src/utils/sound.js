// sound.js — tiny Web Audio–based sound effects, synthesized on the fly so
// the project doesn't need to bundle binary .mp3/.wav assets. One shared
// AudioContext, created lazily on first use (browsers block autoplay of
// audio contexts started before a user gesture, so this is intentional).

const MUTE_KEY = 'ludo_muted';

let ctx = null;
function getContext() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(muted) {
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  listeners.forEach((fn) => fn(muted));
}

export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// Lets components (e.g. a mute button) re-render on mute changes triggered
// elsewhere, without prop-drilling shared state through the whole tree.
const listeners = new Set();
export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function tone({ freq, duration, type = 'sine', gain = 0.15, delay = 0 }) {
  const audio = getContext();
  if (!audio || isMuted()) return;

  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(audio.destination);

  const start = audio.currentTime + delay;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** A quick rattle of clicks, roughly matching the dice's ~800ms spin. */
export function playDiceRoll() {
  const clicks = 6;
  for (let i = 0; i < clicks; i += 1) {
    tone({
      freq: 300 + Math.random() * 200,
      duration: 0.05,
      type: 'square',
      gain: 0.06,
      delay: i * 0.1,
    });
  }
}

export function playTokenMove() {
  tone({ freq: 520, duration: 0.08, type: 'triangle', gain: 0.08 });
}

export function playCapture() {
  tone({ freq: 220, duration: 0.18, type: 'sawtooth', gain: 0.1 });
  tone({ freq: 160, duration: 0.22, type: 'sawtooth', gain: 0.08, delay: 0.08 });
}

export function playTokenHome() {
  tone({ freq: 660, duration: 0.12, type: 'sine', gain: 0.1 });
  tone({ freq: 880, duration: 0.16, type: 'sine', gain: 0.1, delay: 0.1 });
}

export function playPlayerJoined() {
  tone({ freq: 440, duration: 0.1, type: 'sine', gain: 0.08 });
  tone({ freq: 660, duration: 0.12, type: 'sine', gain: 0.08, delay: 0.09 });
}

export function playChat() {
  tone({ freq: 900, duration: 0.06, type: 'sine', gain: 0.06 });
}

export function playVictory() {
  [523, 659, 784, 1046].forEach((freq, i) =>
    tone({ freq, duration: 0.3, type: 'triangle', gain: 0.12, delay: i * 0.12 })
  );
}
