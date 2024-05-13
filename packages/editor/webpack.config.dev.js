const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.prod.tsx',
    output: {
        path: path.resolve(__dirname, 'dev'),
        filename: 'bundle.js',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    target: 'web',
    devtool: "eval-source-map",
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        // alias: {
        //     '@harmony': path.resolve(__dirname, '../'),
        //     'react': path.resolve(path.join(__dirname, '../..'), './node_modules/react'),
        // }
    },
    plugins: [
        new webpack.EnvironmentPlugin({ ...process.env })
    ],
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
            {
                test: /\.css$/,
                use: [
                    'style-loader', 
                    'css-loader',
                    'postcss-loader'
                ],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },
}