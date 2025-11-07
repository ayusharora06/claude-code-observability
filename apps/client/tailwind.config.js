/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Default to dark theme
  theme: {
    extend: {
      screens: {
        'mobile': {'max': '699px'}, // Custom mobile breakpoint for < 700px
        'short': {'raw': '(max-height: 400px)'}, // Custom breakpoint for height <= 400px
      },
      colors: {
        // Dark theme colors only
        'theme': {
          'primary': '#3b82f6', // Blue primary
          'primary-hover': '#2563eb',
          'primary-light': '#60a5fa',
          'primary-dark': '#1d4ed8',
          'bg': {
            'primary': '#111827', // Very dark gray
            'secondary': '#1f2937', // Dark gray
            'tertiary': '#374151', // Medium gray
            'quaternary': '#4b5563', // Light gray
          },
          'text': {
            'primary': '#f9fafb', // Almost white
            'secondary': '#e5e7eb', // Light gray
            'tertiary': '#d1d5db', // Medium gray
            'quaternary': '#9ca3af', // Darker gray
          },
          'border': {
            'primary': '#374151', // Medium gray
            'secondary': '#4b5563', // Light gray
            'tertiary': '#6b7280', // Lighter gray
          },
          'accent': {
            'success': '#10b981', // Green
            'warning': '#f59e0b', // Orange
            'error': '#ef4444', // Red
            'info': '#3b82f6', // Blue
          }
        }
      },
      boxShadow: {
        'theme': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        'theme-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      },
      transitionProperty: {
        'theme': 'all',
        'theme-fast': 'color, background-color, border-color',
      }
    },
  },
  plugins: [],
  safelist: [
    // Background colors
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500',
    'bg-teal-500', 'bg-cyan-500',
    // Border colors
    'border-blue-500', 'border-green-500', 'border-yellow-500',
    'border-purple-500', 'border-pink-500', 'border-indigo-500',
    'border-red-500', 'border-orange-500', 'border-teal-500',
    'border-cyan-500',
    // Gradient colors
    'from-blue-500', 'to-blue-600', 'from-green-500', 'to-green-600',
    'from-yellow-500', 'to-yellow-600', 'from-purple-500', 'to-purple-600',
    'from-pink-500', 'to-pink-600', 'from-indigo-500', 'to-indigo-600',
    'from-red-500', 'to-red-600', 'from-orange-500', 'to-orange-600',
    'from-teal-500', 'to-teal-600', 'from-cyan-500', 'to-cyan-600',
  ]
}