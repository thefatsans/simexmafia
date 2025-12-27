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



