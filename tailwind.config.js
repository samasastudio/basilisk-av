/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Postmodern dark theme palette
        'pm-bg': '#0a0a0a',
        'pm-panel': '#1a1a1a',
        'pm-border': '#333333',
        'pm-text': '#e0e0e0',
        'pm-accent': '#ff00ff', // Magenta
        'pm-secondary': '#00ffff', // Cyan
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}
