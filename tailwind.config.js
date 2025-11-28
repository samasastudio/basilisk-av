// tailwind.config.js
// Basilisk AV - Algorithmic Minimalism Design System

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome Base (for UI overlay)
        basilisk: {
          // Pure black/white for maximum contrast over Hydra
          black: '#000000',
          white: '#FFFFFF',

          // Near-black/white for softer contrast
          'near-black': '#0a0a0a',
          'near-white': '#f5f5f5',

          // Grays (minimal, stepped)
          gray: {
            900: '#1a1a1a',  // Darkest gray (bg)
            800: '#2a2a2a',
            700: '#3a3a3a',
            600: '#4a4a4a',
            500: '#6a6a6a',  // Mid gray
            400: '#8a8a8a',
            300: '#aaaaaa',
            200: '#cacaca',
            100: '#e5e5e5',  // Lightest gray (text on dark)
          },

          // Accent colors (minimal, for UI states only)
          accent: {
            // Cool minimal (matches Hydra palette)
            cool: {
              DEFAULT: '#4d80cc',  // rgb(77, 128, 204) - (0.3, 0.5, 0.8)
              dark: '#3366b3',
              light: '#6699e6',
              muted: '#5a7d9e',  // Desaturated
            },
            // Warm minimal
            warm: {
              DEFAULT: '#cc804d',  // rgb(204, 128, 77) - (0.8, 0.5, 0.3)
              dark: '#b36633',
              light: '#e69966',
              muted: '#9e7d5a',  // Desaturated
            },
          },

          // Semantic colors
          success: '#4d9966',   // Muted green
          warning: '#cc994d',   // Muted amber
          error: '#cc4d66',     // Muted red
          info: '#4d80cc',      // Same as cool accent
        },
      },

      fontFamily: {
        // Monospace for code editor
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'SF Mono',
          'Consolas',
          'Monaco',
          'monospace'
        ],
        // Sans for UI elements
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
      },

      fontSize: {
        // Stepped scale (minimal options)
        'xs': ['0.75rem', { lineHeight: '1.5' }],    // 12px
        'sm': ['0.875rem', { lineHeight: '1.5' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.5' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.4' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],    // 24px
      },

      spacing: {
        // 8px base grid
        '0': '0',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
        '24': '6rem',     // 96px
      },

      borderRadius: {
        // Minimal, subtle rounding
        'none': '0',
        'sm': '0.125rem',   // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
      },

      opacity: {
        // Overlay opacity levels
        '85': '0.85',  // Default terminal overlay
        '90': '0.90',  // More opaque (easier reading)
        '80': '0.80',  // More transparent (more Hydra)
        '95': '0.95',  // Maximum opacity
        '70': '0.70',  // Light overlays
      },

      backdropBlur: {
        // For glassmorphism effects
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
      },

      animation: {
        // Slow, meditative animations only
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      transitionDuration: {
        // Slow, intentional transitions
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
    },
  },
  plugins: [],
}
