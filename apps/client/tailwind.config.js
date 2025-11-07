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
        // Pure gray dark theme colors
        'theme': {
          'primary': '#525252', // Gray-600
          'primary-hover': '#404040',
          'primary-light': '#737373',
          'primary-dark': '#262626',
          'bg': {
            'primary': '#0a0a0a', // Deep black
            'secondary': '#111111', // Very dark gray
            'tertiary': '#1a1a1a', // Dark gray
            'quaternary': '#222222', // Medium dark gray
          },
          'text': {
            'primary': '#f8f9fa', // Very light gray (almost white)
            'secondary': '#e9ecef', // Light gray
            'tertiary': '#dee2e6', // Medium light gray
            'quaternary': '#adb5bd', // Medium gray
          },
          'border': {
            'primary': '#2a2a2a', // Subtle dark gray
            'secondary': '#333333', // Dark gray
            'tertiary': '#404040', // Medium dark gray
          },
          'accent': {
            'success': '#6b7280', // Gray-500
            'warning': '#9ca3af', // Gray-400
            'error': '#4b5563', // Gray-600
            'info': '#525252', // Gray-600
          }
        }
      },
      boxShadow: {
        'theme': '0 4px 6px -1px rgba(0, 0, 0, 0.6)',
        'theme-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
      },
      transitionProperty: {
        'theme': 'all',
        'theme-fast': 'color, background-color, border-color',
      }
    },
  },
  plugins: [],
  safelist: [
    // Gray-only background colors
    'bg-gray-600', 'bg-gray-700', 'bg-gray-800',
    'bg-slate-600', 'bg-slate-700', 'bg-slate-800',
    'bg-zinc-600', 'bg-zinc-700', 'bg-zinc-800',
    'bg-neutral-600', 'bg-neutral-700', 'bg-neutral-800',
    'bg-stone-600', 'bg-stone-700', 'bg-stone-800',
    // Gray-only border colors  
    'border-gray-500', 'border-gray-600', 'border-gray-700',
    'border-slate-500', 'border-slate-600', 'border-slate-700',
    'border-zinc-500', 'border-zinc-600', 'border-zinc-700',
    'border-neutral-500', 'border-neutral-600', 'border-neutral-700',
    'border-stone-500', 'border-stone-600', 'border-stone-700',
    // Gray-only gradient colors
    'from-gray-600', 'to-gray-700', 'from-gray-700', 'to-gray-800',
    'from-slate-600', 'to-slate-700', 'from-slate-700', 'to-slate-800',
    'from-zinc-600', 'to-zinc-700', 'from-zinc-700', 'to-zinc-800',
    'from-neutral-600', 'to-neutral-700', 'from-neutral-700', 'to-neutral-800',
    'from-stone-600', 'to-stone-700', 'from-stone-700', 'to-stone-800',
  ]
}