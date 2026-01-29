/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f9f506',
        'background-light': '#f8f8f5',
        // Dark theme (cool blue/gray)
        'background-dark': '#0b1220',
        'card-light': '#ffffff',
        'card-dark': '#111c2e',
        // Text tokens (app is dark-first)
        'text-main': '#e6edf6',
        'text-muted': '#9aa4b2',
        // Semantic colors for consistent UI
        success: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#166534',
        },
        danger: {
          light: '#fef2f2',
          DEFAULT: '#ef4444',
          dark: '#991b1b',
        },
        warning: {
          light: '#ffedd5',
          DEFAULT: '#f97316',
          dark: '#9a3412',
        },
      },
      fontFamily: {
        display: ['Spline Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
