/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcPlugins: [
            [
                process.env.NODE_ENV === 'development' ? 
                    require.resolve("./packages/swc-plugin/target/wasm32-wasi/release/harmony_plugin.wasm") : 
                    require.resolve('./packages/swc-plugin/harmony_plugin.wasm'), 
                    {rootDir: __dirname}
            ],
        ],
    },
}

module.exports = nextConfig
