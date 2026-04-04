/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#c9a227',
        surface: '#0d0d0d',
        bg: '#050505',
      },
    },
  },
  plugins: [],
}
