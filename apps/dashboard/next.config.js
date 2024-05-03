const path = require('node:path');
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
        config.plugins = [...config.plugins, new PrismaPlugin(), new webpack.EnvironmentPlugin({ENV: process.env.ENV})];
        }
        return config;
    },
    experimental: {
        swcPlugins: process.env.ENV !== 'production' ? [
            [
                require.resolve('harmony-ai-plugin'), 
                {rootDir: path.join(__dirname, '../..')}
            ],
        ] : undefined,
    },
}

module.exports = nextConfig
