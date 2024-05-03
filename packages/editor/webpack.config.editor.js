const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.prod.tsx',
    output: {
        path: path.resolve(__dirname, 'dist/editor'),
        filename: 'bundle.js',
        //library: 'HarmonySetup',
        libraryTarget: 'umd',
        // publicPath: '/dist',
        globalObject: 'this',
        //libraryTarget: 'umd',
    },
    target: 'web',
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        // alias: {
        //     '@harmony': path.resolve(__dirname, '../'),
        //     'react': path.resolve(path.join(__dirname, '../..'), './node_modules/react'),
        // }
    },
    plugins: [
        new webpack.DefinePlugin({
            process: {
                env: {
                    "ENV": JSON.stringify("production"),
                    "EDITOR_PORT": "4200",
                    "EDITOR_URL": JSON.stringify("https://harmony-ui.fly.dev"),
                }
            }
        })
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
    // externals: {
    //     react: {
    //       commonjs: "react",
    //       commonjs2: "react",
    //       amd: "React",
    //       root: "React"
    //     },
    //     "react-dom": {
    //       commonjs: "react-dom",
    //       commonjs2: "react-dom",
    //       amd: "ReactDOM",
    //       root: "ReactDOM"
    //     },
    //     url: 'url'
    //   },
    // externals: {
    //     'react-dom': 'ReactDOM'
    // }
    // output: {
    //     globalObject: 'this'
    // }
}