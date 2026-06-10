/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PoE-inspired dark palette
        poe: {
          // Backgrounds
          bg:         '#0d0d0f',
          surface:    '#141418',
          panel:      '#1a1a20',
          elevated:   '#202028',
          border:     '#2a2a35',
          // Accent: aged gold
          gold:       '#c8a84b',
          'gold-dim': '#8a7030',
          'gold-glow':'#e8c86a',
          // Accent: crimson
          crimson:    '#8b1a1a',
          'crimson-bright': '#c0392b',
          'crimson-glow':   '#e74c3c',
          // Text
          text:       '#e8e0d0',
          muted:      '#7a7268',
          subtle:     '#4a4840',
          // Status
          success:    '#4a7c59',
          warning:    '#b8860b',
          danger:     '#8b1a1a',
          info:       '#2a5880',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Cinzel', 'serif'], // Ancient/fantasy feel for titles
      },
      boxShadow: {
        'gold':    '0 0 12px rgba(200, 168, 75, 0.25)',
        'crimson': '0 0 12px rgba(139, 26, 26, 0.4)',
        'panel':   '0 4px 24px rgba(0, 0, 0, 0.6)',
        'inner-gold': 'inset 0 1px 0 rgba(200, 168, 75, 0.2)',
      },
      backgroundImage: {
        'gradient-panel': 'linear-gradient(135deg, #1a1a20 0%, #141418 100%)',
        'gradient-gold':  'linear-gradient(90deg, #8a7030 0%, #c8a84b 50%, #8a7030 100%)',
        'gradient-hero':  'radial-gradient(ellipse at top, #1a1410 0%, #0d0d0f 70%)',
      },
      animation: {
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 6px rgba(200, 168, 75, 0.2)' },
          '50%':      { boxShadow: '0 0 18px rgba(200, 168, 75, 0.5)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
