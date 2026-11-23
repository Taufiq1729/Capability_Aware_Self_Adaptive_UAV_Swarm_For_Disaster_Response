/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aerospace: {
          950: '#070B14',
          900: '#0B111E',
          850: '#0F172A',
          800: '#152037',
          750: '#1C2B4B',
          700: '#253861',
          600: '#334D80',
        },
        cream: {
          50: '#0B111E',
          100: '#070B14',
          200: '#152037',
          300: '#1E2D4A',
          400: '#334D80',
        },
        charcoal: {
          900: '#F8FAFC',
          800: '#F1F5F9',
          700: '#E2E8F0',
          600: '#94A3B8',
          500: '#64748B',
          400: '#475569',
        },
        terracotta: {
          50: 'rgba(249, 115, 22, 0.1)',
          100: 'rgba(249, 115, 22, 0.2)',
          200: 'rgba(249, 115, 22, 0.35)',
          300: '#FB923C',
          400: '#F97316',
          500: '#EA580C',
          600: '#C2410C',
          700: '#9A3412',
        },
        sage: {
          50: 'rgba(16, 185, 129, 0.1)',
          100: 'rgba(16, 185, 129, 0.2)',
          200: 'rgba(16, 185, 129, 0.35)',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
        },
        warning: {
          50: 'rgba(245, 158, 11, 0.1)',
          100: 'rgba(245, 158, 11, 0.2)',
          500: '#F59E0B',
          600: '#D97706',
        },
        critical: {
          50: 'rgba(239, 68, 68, 0.1)',
          100: 'rgba(239, 68, 68, 0.2)',
          500: '#EF4444',
          600: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Chakra Petch', 'Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 3px 0 rgba(0, 0, 0, 0.35)',
        'cyan-glow': '0 0 15px -3px rgba(6, 182, 212, 0.4)',
        'emerald-glow': '0 0 15px -3px rgba(16, 185, 129, 0.4)',
        'amber-glow': '0 0 15px -3px rgba(245, 158, 11, 0.4)',
        'orange-glow': '0 0 15px -3px rgba(249, 115, 22, 0.4)',
        'red-glow': '0 0 15px -3px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}
