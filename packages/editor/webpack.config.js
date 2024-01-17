const path = require('path');

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        // library: 'HarmonyProvider',
        // libraryTarget: 'umd',
        // publicPath: '/dist'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@harmony': path.resolve(__dirname, '../')
        }
    },
    module: {
        rules: [
        {
            test: /\.(ts|tsx)$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.(js|jsx)$/,
            use: 'babel-loader',
            exclude: /node_modules/,
        },
        ],
    },
}