/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0a0a0f',
          card: '#14141f',
          'card-hover': '#1a1a28',
        },
        border: {
          DEFAULT: '#2a2a3e',
          gold: '#8b7355',
        },
        text: {
          primary: '#e8e6e3',
          secondary: '#a0a0b0',
          muted: '#606070',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f0d78c',
          dark: '#8b7355',
        },
        red: {
          DEFAULT: '#c41e3a',
          light: '#e63946',
        },
        green: {
          DEFAULT: '#2d6a4f',
          light: '#52b788',
        },
        blue: {
          DEFAULT: '#1e3a5f',
          light: '#48cae4',
        },
        purple: {
          DEFAULT: '#5a189a',
          light: '#9d4edd',
        },
      },
      fontFamily: {
        display: ['Noto Serif SC', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'qi-flow': 'qi-flow 3s ease infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
