import React from 'react';

// Mounted once at the app root (see App.jsx). Purely decorative, fixed behind
// everything else — pointer-events-none so it never intercepts clicks.
// Pure CSS transform/opacity animation (see index.css `.bg-orb`) so it stays
// GPU-cheap and doesn't fight with React re-renders elsewhere in the tree.
const ORBS = [
  { color: '#f2a341', top: '5%', left: '8%', size: 340, duration: '18s', delay: '0s' },
  { color: '#3b82f6', top: '55%', left: '78%', size: 420, duration: '22s', delay: '-4s' },
  { color: '#22c55e', top: '75%', left: '12%', size: 300, duration: '20s', delay: '-9s' },
  { color: '#ef4444', top: '10%', left: '70%', size: 260, duration: '16s', delay: '-2s' },
];

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="bg-orb absolute rounded-full"
          style={{
            top: orb.top,
            left: orb.left,
            width: orb.size,
            height: orb.size,
            background: orb.color,
            animationDuration: orb.duration,
            animationDelay: orb.delay,
          }}
        />
      ))}
      {/* subtle grain/vignette so orbs don't look too flat */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0e1c_90%)]" />
    </div>
  );
}
