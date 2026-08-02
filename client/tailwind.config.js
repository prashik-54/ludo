/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#0f1424',
          panel: '#171d33',
          panelLight: '#212a49',
          border: '#2b3559',
        },
        ludo: {
          red: '#ef4444',
          redDark: '#b91c1c',
          green: '#22c55e',
          greenDark: '#15803d',
          yellow: '#eab308',
          yellowDark: '#a16207',
          blue: '#3b82f6',
          blueDark: '#1d4ed8',
        },
        accent: '#f2a341',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        // A full rotate(0->360deg) is nearly invisible on a symmetric
        // rounded square — at 90/180/270deg it looks almost identical to
        // 0deg, so it didn't actually read as "rolling." This wobble/shake
        // (small rotation range + vertical bounce) is what real "dice
        // rolling" UI patterns use for a 2D square instead of a full spin.
        'dice-roll': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg) scale(1)' },
          '10%': { transform: 'translateY(-6px) rotate(-14deg) scale(1.06)' },
          '25%': { transform: 'translateY(2px) rotate(11deg) scale(0.95)' },
          '40%': { transform: 'translateY(-5px) rotate(-9deg) scale(1.05)' },
          '55%': { transform: 'translateY(2px) rotate(7deg) scale(0.97)' },
          '70%': { transform: 'translateY(-3px) rotate(-5deg) scale(1.03)' },
          '85%': { transform: 'translateY(1px) rotate(2deg) scale(1)' },
        },
        'token-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(242,163,65,0.6)' },
          '100%': { boxShadow: '0 0 0 10px rgba(242,163,65,0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'dice-roll': 'dice-roll 0.8s cubic-bezier(0.34, 1.2, 0.4, 1)',
        'token-pop': 'token-pop 0.2s ease-out',
        'pulse-ring': 'pulse-ring 1.2s infinite',
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
