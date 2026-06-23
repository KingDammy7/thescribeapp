/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#030812',
          900: '#060d1a',
          800: '#0a1628',
          700: '#0f1f38',
          600: '#142845',
          500: '#1c3560',
        },
        gold: {
          DEFAULT: '#c9a44e',
          light: '#e2c070',
          dim: '#a07830',
        },
        cream: {
          DEFAULT: '#f5efe0',
          dim: '#c8b99a',
        },
      },
    },
  },
  plugins: [],
};
