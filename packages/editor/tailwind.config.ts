import baseConfig from '@harmony/tailwind-config/tailwind.config'
import type { Config } from 'tailwindcss'

baseConfig.content = [
  '../../packages/ui/src/components/core/**/*.{ts,tsx}',
  './src/**/*.{ts,tsx}',
]
baseConfig.corePlugins = {
  preflight: false,
}
export default baseConfig satisfies Config
