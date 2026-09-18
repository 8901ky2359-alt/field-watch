import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        before: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#eff6ff',
        },
        after: {
          DEFAULT: '#16a34a',
          dark: '#15803d',
          light: '#f0fdf4',
        },
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
};

export default config;
