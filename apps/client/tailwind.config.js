/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Support both light and dark themes
  theme: {
    extend: {
      screens: {
        'mobile': {'max': '699px'}, // Custom mobile breakpoint for < 700px
        'short': {'raw': '(max-height: 400px)'}, // Custom breakpoint for height <= 400px
      },
      colors: {
        // Modern light theme with vibrant event colors
        'theme': {
          'primary': '#3b82f6', // Blue-500
          'primary-hover': '#2563eb', // Blue-600
          'primary-light': '#60a5fa', // Blue-400
          'primary-dark': '#1d4ed8', // Blue-700
          'bg': {
            'primary': '#ffffff', // Pure white
            'secondary': '#f8fafc', // Slate-50
            'tertiary': '#f1f5f9', // Slate-100
            'quaternary': '#e2e8f0', // Slate-200
          },
          'text': {
            'primary': '#0f172a', // Slate-900
            'secondary': '#1e293b', // Slate-800
            'tertiary': '#334155', // Slate-700
            'quaternary': '#64748b', // Slate-500
          },
          'border': {
            'primary': '#e2e8f0', // Slate-200
            'secondary': '#cbd5e1', // Slate-300
            'tertiary': '#94a3b8', // Slate-400
          },
          'accent': {
            'success': '#22c55e', // Green-500
            'warning': '#f59e0b', // Amber-500
            'error': '#ef4444', // Red-500
            'info': '#3b82f6', // Blue-500
          }
        },
        // Event-type specific colors
        'event': {
          'tool': '#3b82f6', // Blue
          'tool-light': '#dbeafe',
          'tool-dark': '#1e40af',
          'session': '#22c55e', // Green
          'session-light': '#dcfce7',
          'session-dark': '#15803d',
          'prompt': '#f97316', // Orange
          'prompt-light': '#fed7aa',
          'prompt-dark': '#ea580c',
          'notification': '#a855f7', // Purple
          'notification-light': '#f3e8ff',
          'notification-dark': '#7c3aed',
          'error': '#ef4444', // Red
          'error-light': '#fee2e2',
          'error-dark': '#dc2626',
          'system': '#6366f1', // Indigo
          'system-light': '#e0e7ff',
          'system-dark': '#4338ca',
        },
        // Topic tile colors (12 vibrant colors)
        'topic': {
          'emerald': '#10b981',
          'emerald-light': '#d1fae5',
          'cyan': '#06b6d4', 
          'cyan-light': '#cffafe',
          'sky': '#0ea5e9',
          'sky-light': '#e0f2fe',
          'violet': '#8b5cf6',
          'violet-light': '#ede9fe',
          'pink': '#ec4899',
          'pink-light': '#fce7f3',
          'rose': '#f43f5e',
          'rose-light': '#ffe4e6',
          'amber': '#f59e0b',
          'amber-light': '#fef3c7',
          'lime': '#84cc16',
          'lime-light': '#ecfccb',
          'teal': '#14b8a6',
          'teal-light': '#ccfbf1',
          'fuchsia': '#d946ef',
          'fuchsia-light': '#fae8ff',
          'indigo': '#6366f1',
          'indigo-light': '#e0e7ff',
          'orange': '#f97316',
          'orange-light': '#fed7aa',
        }
      },
      boxShadow: {
        'theme': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'theme-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'tile': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'tile-hover': '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
      },
      transitionProperty: {
        'theme': 'all',
        'theme-fast': 'color, background-color, border-color',
        'card': 'box-shadow, transform, border-color',
        'tile': 'all',
      }
    },
  },
  plugins: [],
  safelist: [
    // Event type colors
    'bg-event-tool', 'bg-event-tool-light', 'border-event-tool', 'border-l-event-tool',
    'bg-event-session', 'bg-event-session-light', 'border-event-session', 'border-l-event-session',
    'bg-event-prompt', 'bg-event-prompt-light', 'border-event-prompt', 'border-l-event-prompt',
    'bg-event-notification', 'bg-event-notification-light', 'border-event-notification', 'border-l-event-notification',
    'bg-event-error', 'bg-event-error-light', 'border-event-error', 'border-l-event-error',
    'bg-event-system', 'bg-event-system-light', 'border-event-system', 'border-l-event-system',
    // Topic tile colors
    'bg-topic-emerald', 'bg-topic-emerald-light', 'border-topic-emerald',
    'bg-topic-cyan', 'bg-topic-cyan-light', 'border-topic-cyan',
    'bg-topic-sky', 'bg-topic-sky-light', 'border-topic-sky',
    'bg-topic-violet', 'bg-topic-violet-light', 'border-topic-violet',
    'bg-topic-pink', 'bg-topic-pink-light', 'border-topic-pink',
    'bg-topic-rose', 'bg-topic-rose-light', 'border-topic-rose',
    'bg-topic-amber', 'bg-topic-amber-light', 'border-topic-amber',
    'bg-topic-lime', 'bg-topic-lime-light', 'border-topic-lime',
    'bg-topic-teal', 'bg-topic-teal-light', 'border-topic-teal',
    'bg-topic-fuchsia', 'bg-topic-fuchsia-light', 'border-topic-fuchsia',
    'bg-topic-indigo', 'bg-topic-indigo-light', 'border-topic-indigo',
    'bg-topic-orange', 'bg-topic-orange-light', 'border-topic-orange',
    // Text colors
    'text-event-tool', 'text-event-session', 'text-event-prompt', 'text-event-notification', 'text-event-error', 'text-event-system',
  ]
}