/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F3EDE2',
          300: '#E8DFD0',
          400: '#D9CBB7',
        },
        charcoal: {
          900: '#1C1917',
          800: '#292524',
          700: '#44403C',
          600: '#57534E',
          500: '#78716C',
        },
        terracotta: {
          50: '#FDF4F0',
          100: '#FBECE5',
          200: '#F6D5C7',
          500: '#C85A32',
          600: '#B44C27',
          700: '#943B1D',
        },
        sage: {
          50: '#F2F7F4',
          100: '#E5EFE9',
          200: '#C6DDD0',
          500: '#3D7A5A',
          600: '#32664A',
          700: '#28523B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
        critical: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#C53030',
          600: '#991B1B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
