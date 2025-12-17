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
        'background-dark': '#23220f',
        'card-light': '#ffffff',
        'card-dark': '#2c2b18',
        'text-main': '#181811',
        'text-muted': '#8c8b5f',
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
