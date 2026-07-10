import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF9F6',
        navy: '#001178',
        'navy-ink': '#0a1550',
        'navy-soft': '#e7e8f5',
        gold: '#E8BB00',
        'gold-soft': '#fbf1cc',
      },
      fontFamily: {
        display: ['Georgia', '"Iowan Old Style"', '"Palatino Linotype"', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
