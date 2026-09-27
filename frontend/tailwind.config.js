/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wa: {
          dark: '#111b21',
          panel: '#202c33',
          bubble: '#005c4b',
          incoming: '#202c33',
          teal: '#00a884',
          subtle: '#8696a0',
          border: '#2a3942',
          lightBg: '#0c1317',
          highlight: '#2a3942'
        },
        cyber: {
          gold: '#eab308',
          amber: '#f59e0b',
          emerald: '#10b981',
          danger: '#ef4444',
          cyan: '#06b6d4',
          slate: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
