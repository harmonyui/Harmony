import baseConfig from '@harmony/tailwind-config/tailwind.config'
import type { Config } from 'tailwindcss'

baseConfig.content = [
  '../../packages/ui/src/components/**/*.{ts,tsx}',
  '../../packages/editor/src/**/*.{ts,tsx}',
  './src/**/*.{ts,tsx}',
]

export default baseConfig satisfies Config
