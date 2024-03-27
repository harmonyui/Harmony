/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcPlugins: process.env.ENV !== 'production' ? [
            [
                require.resolve('./packages/swc-plugin/harmony_plugin.wasm'), 
                {rootDir: __dirname}
            ],
        ] : undefined,
    },
}

module.exports = nextConfig
