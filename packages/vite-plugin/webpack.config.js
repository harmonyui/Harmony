const path = require('node:path');

module.exports = {
    entry: './src/plugin.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        library: 'harmony',
        libraryTarget: 'umd',
        libraryExport: "default",
        globalObject: 'this',
    },
    target: 'node',
    resolve: {
        extensions: ['.ts', '.js'],
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