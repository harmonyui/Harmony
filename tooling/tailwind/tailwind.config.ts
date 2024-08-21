import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export const files = [
  '../../packages/ui/src/**/*.{ts,tsx}',
  '../../apps/dashboard/app/**/*.{ts,tsx}',
  '../../apps/dashboard/utils/**/*.{ts,tsx}',
  '../../packages/editor/src/**/*.{ts,tsx}',
]

const config: Config = {
  prefix: 'hw-',
  content: files,
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
        },
        slate: {
          '20': '#E5E7EB',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    //forms
  ],
}
export default config
