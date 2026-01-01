/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        fortnite: {
          yellow: '#FFD700',
          purple: '#8B5CF6',
          dark: '#1a1a2e',
          darker: '#0f0f1e',
          'light-bg': '#f8f9fa',
          'light-surface': '#ffffff',
          'light-border': '#e5e7eb',
        },
        winter: {
          ice: '#E0F2FE',
          'ice-light': '#F0F9FF',
          'ice-dark': '#BAE6FD',
          snow: '#FFFFFF',
          'snow-blue': '#E6F3FF',
          frost: '#B3E5FC',
          'frost-dark': '#81D4FA',
          silver: '#C0C0C0',
          'silver-light': '#E8E8E8',
          blue: '#0EA5E9',
          'blue-dark': '#0284C7',
          'blue-light': '#38BDF8',
        },
        // Light mode colors
        light: {
          bg: '#f8f9fa',
          surface: '#ffffff',
          border: '#e5e7eb',
          text: '#111827',
          'text-secondary': '#6b7280',
        }
      },
    },
  },
  plugins: [],
}



