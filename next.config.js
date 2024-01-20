/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcPlugins: [
            [require.resolve("./harmony-plugin/target/wasm32-wasi/release/harmony_plugin.wasm")],
        ],
    },
}

module.exports = nextConfig
