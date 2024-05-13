const path = require('path');

module.exports = {
    entry: './src/babel-plugin.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    target: 'node',
    resolve: {
        extensions: ['.ts'],
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
}