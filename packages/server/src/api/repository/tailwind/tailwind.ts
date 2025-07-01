import resolveConfig from 'tailwindcss/resolveConfig'
import type { Config } from 'tailwindcss'
import type { Token } from '@harmony/util/src/types/tokens'
import type { RepositoryConfig } from '@harmony/util/src/types/branch'

const attributToConfigMapping: Record<
  string,
  keyof ReturnType<typeof resolveConfig>['theme']
> = {
  backgroundColor: 'colors',
  color: 'colors',
  borderColor: 'colors',
  borderRadius: 'borderRadius',
  borderWidth: 'borderWidth',
  width: 'width',
  height: 'height',
  minWidth: 'minWidth',
  minHeight: 'minHeight',
  maxWidth: 'maxWidth',
  maxHeight: 'maxHeight',
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

export const resolveTailwindConfig = async (
  tailwindConfig: RepositoryConfig['tailwindConfig'],
): Promise<Token[]> => {
  const baseConfig = tailwindConfig as Required<
    Required<Config>['theme']
  >['extend']
  const fullConfig = resolveConfig({
    theme: { extend: { ...baseConfig } },
    content: [],
  })

  const tokens = Object.entries(attributToConfigMapping).map<Token>(
    ([attribute, name]) => {
      const configValue = fullConfig.theme[name]
      const baseValue = baseConfig[name]

      const baseValuesFirst = Object.entries(configValue).filter(
        ([key]) =>
          (baseValue as Record<string, unknown> | undefined)?.[key] !==
          undefined,
      )
      const otherValuesLast = Object.entries(configValue).filter(
        ([key]) =>
          (baseValue as Record<string, unknown> | undefined)?.[key] ===
          undefined,
      )
      const defaultColor =
        name === 'colors' ? [{ name: 'default-color', value: '#00000000' }] : []

      const recurseUpdateValue = (
        name: string,
        value: unknown,
      ): { name: string; value: string }[] =>
        typeof value === 'string'
          ? [{ name, value }]
          : Array.isArray(value)
            ? [{ name, value: value[0] as string }]
            : typeof value === 'object'
              ? Object.entries(value as object).flatMap(([a, b]) =>
                  recurseUpdateValue(
                    a.toUpperCase() === 'DEFAULT' ? name : `${name}-${a}`,
                    b,
                  ),
                )
              : []

      return {
        name: attribute,
        values: [
          ...defaultColor,
          ...baseValuesFirst.flatMap(([key, value]) =>
            recurseUpdateValue(key, value),
          ),
          ...otherValuesLast.flatMap(([key, value]) =>
            recurseUpdateValue(key, value),
          ),
        ],
      }
    },
  )

  return tokens
}

// const baseConfig: Config = {
//   content: [
//     './pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './components/**/*.{js,ts,jsx,tsx,mdx}',
//     './app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       backgroundImage: {
//         'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
//         'gradient-conic':
//           'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
//       },
//       colors: {
//         primary: {
//           lighter: '#55565a',
//           DEFAULT: '#555659',
//           darker: '#030712',
//         },
//         secondary: {
//           DEFAULT: '#f2f0ef',
//         },
//         muted: 'hsl(var(--muted))',
//       },
//       keyframes: {
//         'fade-in': {
//           from: { opacity: '0', transform: 'translateY(-10px)' },
//           to: { opacity: '1', transform: 'none' },
//         },
//         'fade-up': {
//           from: { opacity: '0', transform: 'translateY(20px)' },
//           to: { opacity: '1', transform: 'none' },
//         },
//       },
//       animation: {
//         'fade-in': 'fade-in 1s var(--animation-delay,0ms) ease forwards',
//         'fade-up': 'fade-up 1s var(--animation-delay,0ms) ease forwards',
//       },
//     },
//   },
// }
