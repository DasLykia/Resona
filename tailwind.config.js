// color-mix keeps opacity modifiers (bg-primary/10) working on CSS-variable colours
const token = (v) => `color-mix(in oklch, var(${v}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        background: token('--bg-app'),
        sidebar: token('--bg-sidebar'),
        surface: token('--bg-surface'),
        'surface-highlight': token('--bg-panel'),
        primary: token('--col-primary'),
        'primary-hover': token('--col-primary-hover'),
        'on-primary': token('--on-primary'),
        secondary: token('--col-secondary'),
        danger: token('--col-danger'),
        text: token('--text-main'),
        'text-muted': token('--text-muted'),
        border: 'var(--border-color)',
        'border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        sans: ['Geist', 'Segoe UI Variable Text', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'Consolas', 'monospace'],
      },
      // Small, concentric radii: controls 6px, surfaces 10px. Old rounded-2xl/3xl usages shrink with this.
      borderRadius: {
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
        '3xl': '12px',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
