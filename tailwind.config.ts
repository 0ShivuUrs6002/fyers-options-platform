import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b0d11',
          card: '#12151c',
          elevated: '#181c26',
          border: '#1e2333',
          hover: '#242a3a',
        },
        text: {
          primary: '#e8eaed',
          secondary: '#8b92a5',
          muted: '#555d73',
        },
        bullish: {
          DEFAULT: '#00d68f',
          dim: 'rgba(0, 214, 143, 0.15)',
        },
        bearish: {
          DEFAULT: '#ff4757',
          dim: 'rgba(255, 71, 87, 0.15)',
        },
        accent: {
          blue: '#4a9eff',
          amber: '#ffb74d',
          purple: '#b39ddb',
        },
      },
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'spot': ['2.5rem', { lineHeight: '1', fontWeight: '700' }],
        'metric': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};

export default config;
