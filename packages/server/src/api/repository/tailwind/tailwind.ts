/* eslint-disable no-nested-ternary */
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '@harmony/ui/tailwind.config'
import type { Config } from 'tailwindcss'
import type { Token } from '@harmony/util/src/types/tokens'

const attributToConfigMapping: Record<
  string,
  keyof ReturnType<typeof resolveConfig>['theme']
> = {
  backgroundColor: 'colors',
  color: 'colors',
  borderColor: 'colors',
  borderRadius: 'borderRadius',
  padding: 'padding',
  paddingLeft: 'padding',
  paddingRight: 'padding',
  paddingTop: 'padding',
  paddingBottom: 'padding',
  margin: 'margin',
  marginLeft: 'margin',
  marginRight: 'margin',
  marginTop: 'margin',
  marginBottom: 'margin',
  gap: 'gap',
  rowGap: 'gap',
  columnGap: 'gap',
  fontWeight: 'fontWeight',
  fontSize: 'fontSize',
}

export const resolveTailwindConfig = (): Token[] => {
  const fullConfig = resolveConfig(baseConfig)

  const tokens = Object.entries(attributToConfigMapping).map<Token>(
    ([attribute, name]) => {
      const configValue = fullConfig.theme[name]
      const baseValue = baseConfig.theme?.extend
        ? (baseConfig.theme.extend[name] ?? {})
        : {}

      const baseValuesFirst = Object.entries(configValue).filter(
        ([key]) => (baseValue as Record<string, unknown>)[key] !== undefined,
      )
      const otherValuesLast = Object.entries(configValue).filter(
        ([key]) => (baseValue as Record<string, unknown>)[key] === undefined,
      )
      const defaultColor =
        name === 'colors' ? [{ name: 'default-color', value: '#00000000' }] : []

      return {
        name: attribute,
        values: [
          ...defaultColor,
          ...baseValuesFirst.flatMap(([key, value]) =>
            typeof value === 'string'
              ? [{ name: key, value }]
              : Array.isArray(value)
                ? { name: key, value: value[0] as string }
                : typeof value === 'object'
                  ? Object.entries(value as object).map(([a, b]) => ({
                      name: a.toUpperCase() === 'DEFAULT' ? key : `${key}-${a}`,
                      value: b as string,
                    }))
                  : [],
          ),
          ...otherValuesLast.flatMap(([key, value]) =>
            typeof value === 'string'
              ? [{ name: key, value }]
              : Array.isArray(value)
                ? { name: key, value: value[0] as string }
                : typeof value === 'object'
                  ? Object.entries(value as object).map(([a, b]) => ({
                      name: a.toUpperCase() === 'DEFAULT' ? key : `${key}-${a}`,
                      value: b as string,
                    }))
                  : [],
          ),
        ],
      }
    },
  )

  return tokens
}

const baseConfig: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: {
          lighter: '#55565a',
          DEFAULT: '#555659',
          darker: '#030712',
        },
        secondary: {
          DEFAULT: '#f2f0ef',
        },
        muted: 'hsl(var(--muted))',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-in': 'fade-in 1s var(--animation-delay,0ms) ease forwards',
        'fade-up': 'fade-up 1s var(--animation-delay,0ms) ease forwards',
      },
    },
  },
}
