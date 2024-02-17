/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcPlugins: [
            [
                require.resolve('./packages/swc-plugin/harmony_plugin.wasm'), 
                {rootDir: __dirname}
            ],
        ],
    },
}

module.exports = nextConfig
