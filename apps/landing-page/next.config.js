const path = require('node:path')
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    return config
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
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
