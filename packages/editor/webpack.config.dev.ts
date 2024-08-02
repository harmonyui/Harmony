import path from 'node:path'
import type { Configuration } from 'webpack'
import webpack from 'webpack'

export default {
  entry: [
    'webpack-hot-middleware/client?reload=true&path=http://localhost:4200/__webpack_hmr',
    './src/index.prod.tsx',
  ],
  output: {
    path: path.resolve(__dirname, 'dev'),
    filename: 'bundle.js',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  target: 'web',
  mode: 'development',
  devtool: 'eval-source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    // alias: {
    //     '@harmony': path.resolve(__dirname, '../'),
    //     'react': path.resolve(path.join(__dirname, '../..'), './node_modules/react'),
    // }
  },
  plugins: [
    new webpack.EnvironmentPlugin({ ...process.env }),
    new webpack.HotModuleReplacementPlugin(),
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
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  // devServer: {
  //     historyApiFallback: true,
  //     hot: true,
  //     host: 'localhost', // Defaults to `localhost`
  //     port: 4200, // Defaults to 8080
  //     proxy: [{
  //         '^/trpc/*': {
  //         target: 'http://localhost:8080/trpc/',
  //         secure: false
  //         }
  //     }],
  //     static: './public'
  // }
} satisfies Configuration
