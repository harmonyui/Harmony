const { resolve } = require('node:path')

const project = resolve(process.cwd(), 'tsconfig.json')

/*
 * This is a custom ESLint configuration for use with
 * typescript packages.
 *
 * This config extends the Vercel Engineering Style Guide.
 * For more information, see https://github.com/vercel/style-guide
 *
 */

module.exports = {
  extends: [
    '@vercel/style-guide/eslint/node',
    '@vercel/style-guide/eslint/typescript',
  ].map(require.resolve),
  parserOptions: {
    project,
  },
  globals: {
    React: true,
    JSX: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: ['node_modules/', 'dist/', 'dev/', 'dist-server/'],
  rules: {
    'prefer-named-capture-group': 'off',
    'no-console': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'import/no-default-export': 'off',
    'no-useless-escape': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/require-await': 'off',
  },
}
