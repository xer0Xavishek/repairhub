/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          // Surfaces
          white: '#FFFFFF',
          bg: '#F5F5F7',         // Apple's signature light gray
          elevated: '#FBFBFD',   // Slightly elevated surface
          
          // Text hierarchy
          label: '#1D1D1F',      // Primary text (near-black)
          secondary: '#6E6E73',  // Secondary text
          tertiary: '#86868B',   // Tertiary/muted text
          quaternary: '#AEAEB2', // Placeholders
          
          // Borders & separators
          separator: '#D2D2D7',  // Default border
          'separator-light': '#E8E8ED', // Subtle divider
          
          // Apple accent colors
          blue: '#0071E3',       // Primary action (Apple blue)
          'blue-hover': '#0077ED',
          'blue-light': '#EBF5FF',
          green: '#34C759',      // Success
          'green-light': '#E8FAE8',
          orange: '#FF9500',     // Warning
          'orange-light': '#FFF4E5',
          red: '#FF3B30',        // Error/destructive
          'red-light': '#FFEBE9',
          purple: '#AF52DE',     // Info/badge
          'purple-light': '#F5EEFB',
          teal: '#5AC8FA',       // Highlight
          'teal-light': '#E8F7FE',
          indigo: '#5856D6',     // Secondary accent
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'apple-caption2': ['11px', { lineHeight: '13px', letterSpacing: '0.07em', fontWeight: '400' }],
        'apple-caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'apple-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'apple-subhead':  ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'apple-body':     ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'apple-title3':   ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'apple-title2':   ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'apple-title1':   ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'apple-large':    ['34px', { lineHeight: '41px', fontWeight: '700' }],
      },
      boxShadow: {
        'apple-sm': '0 0.5px 1px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'apple-md': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'apple-xl': '0 22px 70px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'apple-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
