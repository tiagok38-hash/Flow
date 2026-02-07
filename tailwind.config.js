/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '999': '999',
        '9999': '9999',
      },
      colors: {
        gray: {
          25: '#fafafa',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        }
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-up-delay-1': 'slideUp 0.25s ease-out 0.1s both',
        'slide-up-delay-2': 'slideUp 0.25s ease-out 0.2s both',
        'slide-up-delay-3': 'slideUp 0.25s ease-out 0.3s both',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'modal-enter': 'modalEnter 0.3s ease-out',
        'modal-exit': 'modalExit 0.3s ease-out',
        'modal-macos-enter': 'modalMacosEnter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'modal-macos-exit': 'modalMacosExit 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'card-stack': 'cardStack 0.5s ease-out',
        'card-expand': 'cardExpand 0.5s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        modalEnter: {
          '0%': { transform: 'scale(0.9) translateY(-20px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        modalExit: {
          '0%': { transform: 'scale(1) translateY(0)', opacity: '1' },
          '30%': { transform: 'scale(0.98) translateY(5px)', opacity: '0.8' },
          '100%': { transform: 'scale(0.85) translateY(-30px)', opacity: '0' },
        },
        modalMacosEnter: {
          '0%': { 
            transform: 'scale(0.1) translate(var(--origin-x, 0), var(--origin-y, 0))', 
            opacity: '0',
            borderRadius: '50%' 
          },
          '50%': { 
            borderRadius: '25%' 
          },
          '100%': { 
            transform: 'scale(1) translate(0, 0)', 
            opacity: '1',
            borderRadius: '1rem' 
          },
        },
        modalMacosExit: {
          '0%': { 
            transform: 'scale(1) translate(0, 0)', 
            opacity: '1',
            borderRadius: '1rem' 
          },
          '20%': { 
            transform: 'scale(0.98) translate(0, 0)',
            borderRadius: '1.2rem',
            opacity: '0.9'
          },
          '40%': { 
            transform: 'scale(0.85) translate(0, 10px)',
            borderRadius: '1.5rem',
            opacity: '0.7'
          },
          '70%': { 
            transform: 'scale(0.4) translate(var(--origin-x, 0), var(--origin-y, 0))',
            borderRadius: '30%',
            opacity: '0.3'
          },
          '100%': { 
            transform: 'scale(0.05) translate(var(--origin-x, 0), var(--origin-y, 0))', 
            opacity: '0',
            borderRadius: '50%' 
          },
        },
        cardStack: {
          '0%': { transform: 'translateY(0) scale(1)', zIndex: '10' },
          '100%': { transform: 'translateY(-12px) scale(0.98)', zIndex: '1' },
        },
        cardExpand: {
          '0%': { transform: 'translateY(-12px) scale(0.98)', zIndex: '1' },
          '100%': { transform: 'translateY(0) scale(1.05)', zIndex: '50' },
        },
      },
    },
  },
  plugins: [],
};
