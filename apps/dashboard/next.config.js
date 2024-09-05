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
    swcPlugins:
      process.env.ENV !== 'production'
        ? [
            [
              require.resolve('harmony-ai-plugin'),
              {
                rootDir: path.join(__dirname, '../..'),
                repositoryId: 'fbefdac4-8370-4d6d-b440-0307882f0102',
              },
            ],
          ]
        : undefined,
  },
}

module.exports = nextConfig
