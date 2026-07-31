/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', 50: '#0B0B10', 100: '#0F0F14', 200: '#16161D', 300: '#1E1E26', 400: '#262630' },
        card: 'rgb(var(--card) / <alpha-value>)',
        primary: {
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7',
          400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857',
          800: '#065F46', 900: '#064E3B',
        },
        accent: {
          50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC',
          400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA',
          800: '#3730A3', 900: '#312E81',
        },
        emerald: { 400: '#34D399', 500: '#10B981', 600: '#059669' },
        indigo: { 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5' },
      },
      borderRadius: {
        '2xl': '14px', '3xl': '18px', '4xl': '22px', '5xl': '28px',
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(255,255,255,0.05), 0 1px 4px rgba(0,0,0,0.3)',
        'glass-md': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.35)',
        'glass-lg': '0 0 0 1px rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.4)',
        'glass-xl': '0 0 0 1px rgba(255,255,255,0.09), 0 24px 64px rgba(0,0,0,0.5)',
        'glow-sm': '0 0 12px rgba(16,185,129,0.10)',
        'glow': '0 0 20px rgba(16,185,129,0.12), 0 0 40px rgba(16,185,129,0.04)',
        'glow-lg': '0 0 32px rgba(16,185,129,0.16), 0 0 64px rgba(16,185,129,0.06)',
        'glow-accent': '0 0 20px rgba(99,102,241,0.12), 0 0 40px rgba(99,102,241,0.04)',
        'elevated': '0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.5)',
      },
      animation: {
        'blob': 'blob 20s ease-in-out infinite',
        'blob-slow': 'blob 30s ease-in-out infinite',
        'blob-reverse': 'blob-reverse 25s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'appear': 'appear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'count': 'count 0.6s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse-slow': 'spin 12s linear infinite reverse',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '75%': { transform: 'translate(40px, 30px) scale(1.05)' },
        },
        'blob-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(-30px, 40px) scale(0.9)' },
          '50%': { transform: 'translate(20px, -30px) scale(1.1)' },
          '75%': { transform: 'translate(-40px, -20px) scale(0.95)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(2deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        appear: {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
}
