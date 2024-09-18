const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    swcPlugins:
      process.env.ENV !== 'production'
        ? [
            [
              require.resolve('harmony-ai-plugin'),
              {
                rootDir: path.join(__dirname, '../..'),
                repositoryId: 'da286f25-b5de-4003-94ed-2944162271ed',
              },
            ],
          ]
        : undefined,
  },
}

module.exports = nextConfig
