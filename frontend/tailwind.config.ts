import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brandRed: '#8B0000',
        brandBeige: '#FFF8E7',
        brandGold: '#D4A017',
        brandBrown: '#5E2A1A'
      }
    }
  },
  plugins: []
};

export default config;
