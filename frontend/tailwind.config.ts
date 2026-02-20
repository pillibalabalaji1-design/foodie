import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brandRed: '#8e1f1b',
        brandBeige: '#f7f1e8',
        brandGreen: '#456c3f'
      }
    }
  },
  plugins: []
};

export default config;
