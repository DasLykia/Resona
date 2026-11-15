/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        'surface-highlight': 'var(--bg-panel)',
        primary: 'var(--col-primary)',
        'primary-hover': 'var(--col-primary-hover)',
        secondary: 'var(--col-secondary)',
        danger: 'var(--col-danger)',
        text: 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border-color)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
