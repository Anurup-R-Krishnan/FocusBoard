/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        titanium: {
          dark: '#151515',
          surface: '#1C1C1E',
          border: '#333333',
          highlight: '#444444',
        },
        accent: {
          blue: '#2F58CD',
          orange: '#FF3B30',
          green: '#30D158',
          purple: '#BF5AF2',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
