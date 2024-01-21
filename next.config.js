/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        swcPlugins: [
            [require.resolve("./packages/swc-plugin/target/wasm32-wasi/release/harmony_plugin.wasm"), {rootDir: __dirname}],
        ],
    },
}

module.exports = nextConfig
