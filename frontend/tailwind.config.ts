import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cosora: {
          black: '#0A0A0A',
          charcoal: '#2F2F2F',
          smoke: '#3D3D3D',
          orange: '#FF6F00',
          gold: '#FFB700',
          light: '#E0E0E0',
          mid: '#9E9E9E',
          white: '#FFFFFF',
          danger: '#D32F2F',
          success: '#2E7D32',
          'amber-bg': '#1A1000',
        },
      },
      fontFamily: {
        serif: ['var(--font-eb-garamond)', 'EB Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-eb-garamond)', 'EB Garamond', 'Georgia', 'serif'],
        mono: ['var(--font-eb-garamond)', 'EB Garamond', 'Georgia', 'serif'],
      },
      animation: {
        pulseOrange: 'pulseOrange 2s ease-in-out infinite',
      },
      keyframes: {
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 111, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 111, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
