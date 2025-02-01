import { defineConfig } from 'tailwindcss-patch'

//Randomize the class prefix so that chrome does not clash with npm editor
const tokens = [
  ...Array.from(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ),
]
const randomToken = () =>
  tokens[Math.round(Math.random() * 10000) % tokens.length]
const classPrefix = `${randomToken()}${randomToken()}-`
console.log(`Using class prefix: ${classPrefix}`)

const config = defineConfig({
  mangle: {
    mangleClassFilter() {
      return true
    },
    classGenerator: {
      classPrefix,
    },
  },
})

export default config
