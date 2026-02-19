/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        surface2: '#1c1c28',
        border: '#2a2a3d',
        accent: '#ff4d6d',
        accent2: '#7c3aed',
        wb: '#cb11ab',
        ozon: '#005bff',
        muted: '#7070a0',
        green: '#22d3a0',
      },
      fontFamily: {
        unbounded: ['var(--font-unbounded)', 'sans-serif'],
        geo: ['var(--font-geologica)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
