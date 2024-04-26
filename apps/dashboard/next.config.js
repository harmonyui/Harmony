/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcPlugins: process.env.ENV !== 'production' ? [
            [
                require.resolve('harmony-ai-plugin'), 
                {rootDir: __dirname}
            ],
        ] : undefined,
    },
}

module.exports = nextConfig
