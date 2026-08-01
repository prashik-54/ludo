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
        'dice-roll': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(90deg) scale(1.1)' },
          '50%': { transform: 'rotate(180deg) scale(0.95)' },
          '75%': { transform: 'rotate(270deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
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
        'dice-roll': 'dice-roll 0.6s ease-in-out',
        'token-pop': 'token-pop 0.2s ease-out',
        'pulse-ring': 'pulse-ring 1.2s infinite',
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
