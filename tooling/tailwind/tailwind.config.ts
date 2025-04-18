import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export const files = [
  '../../packages/ui/src/**/*.{ts,tsx}',
  '../../apps/dashboard/app/**/*.{ts,tsx}',
  '../../apps/landing-page/app/**/*.{ts,tsx}',
  '../../apps/landing-page/components/**/*.{ts,tsx}',
  '../../apps/dashboard/utils/**/*.{ts,tsx}',
  '../../packages/editor/src/**/*.{ts,tsx}',
]

const config: Config = {
  content: files,
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: {
          light: '#6F91E8',
          DEFAULT: '#3A6EF2', //"#318BD0",
          dark: '#101636',
          foreground: '#FFFFFF',
        },
        slate: {
          '20': '#E5E7EB',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'shine-pulse': {
          '0%': {
            'background-position': '0% 0%',
          },
          '50%': {
            'background-position': '100% 100%',
          },
          to: {
            'background-position': '0% 0%',
          },
        },
        rainbow: {
          '0%': { 'background-position': '0%' },
          '100%': { 'background-position': '200%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 1s var(--animation-delay,0ms) ease forwards',
        'fade-up': 'fade-up 1s var(--animation-delay,0ms) ease forwards',
        rainbow: 'rainbow var(--speed, 2s) infinite linear',
      },
    },
  },
  plugins: [animate],
}
export default config
