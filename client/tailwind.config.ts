import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1673C6', dark: '#0F5FA8' },
        navy: '#0F2238',
        ink: '#1E2A38',
        muted: '#5B6B7C',
        bg: '#F6F9FC',
        card: '#E8F1FA',
        gold: '#F2B233',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        h1: ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'h1-lg': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        h2: ['2rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'h2-lg': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.12em' }],
      },
      maxWidth: { content: '1000px' },
      borderRadius: { section: '28px', card: '24px', row: '20px' },
      boxShadow: {
        soft: '0 1px 2px rgba(15,34,56,0.04), 0 8px 24px rgba(15,34,56,0.06)',
        float: '0 24px 60px -12px rgba(15,34,56,0.35)',
      },
      spacing: { section: '6rem', 'section-sm': '4rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.5s infinite' },
    },
  },
  plugins: [],
} satisfies Config;
