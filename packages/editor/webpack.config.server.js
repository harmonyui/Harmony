const path = require('node:path');

module.exports = {
    entry: './src/server.ts',
    output: {
        path: path.resolve(__dirname, 'dist-server'),
        filename: 'server.js',
        //library: 'HarmonySetup',
        // publicPath: '/dist',
        //libraryTarget: 'umd',
    },
    target: 'node',
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    externals: {
        'webpack-dev-middleware': 'middleware',
        'webpack-hot-middleware': 'hotMiddleware',
        'webpack': 'webpack'
    }
}