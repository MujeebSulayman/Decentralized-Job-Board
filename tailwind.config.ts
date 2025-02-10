import type { Config } from "tailwindcss";
import tailwindScrollbar from 'tailwind-scrollbar';

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      scrollbar: {
        thin: '4px',
        track: 'gray-800',
        thumb: 'purple-100',
      },
      backgroundImage: {
        'scrollbar-gradient': 'linear-gradient(to right, #8b5cf6, #6d28d9)',
      }
    },
  },
  plugins: [
    tailwindScrollbar({ nocompatible: true }),
  ],
} satisfies Config;
