const path = require('path');

module.exports = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        library: 'HarmonySetup',
        libraryTarget: 'umd',
        // publicPath: '/dist',
        globalObject: 'this',
        //libraryTarget: 'umd',
    },
    target: 'node',
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@harmony': path.resolve(__dirname, '../'),
            'react': path.resolve(path.join(__dirname, '../..'), './node_modules/react'),
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
            {
                test: /\.css$/,
                use: [
                    'style-loader', 
                    'css-loader',
                    'postcss-loader'
                ],
            },
        ],
    },
    externals: {
        react: {
          commonjs: "react",
          commonjs2: "react",
          amd: "React",
          root: "React"
        },
        "react-dom": {
          commonjs: "react-dom",
          commonjs2: "react-dom",
          amd: "ReactDOM",
          root: "ReactDOM"
        },
        url: 'url'
      },
    // externals: {
    //     'react-dom': 'ReactDOM'
    // }
    // output: {
    //     globalObject: 'this'
    // }
}