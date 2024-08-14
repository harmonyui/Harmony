const path = require('node:path')
const webpack = require('webpack')

module.exports = {
  entry: './src/popup-index.tsx',
  output: {
    path: path.resolve(__dirname, 'extension/dist'),
    filename: 'popup.js',
    globalObject: 'this',
    charset: true,
  },
  target: 'web',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  plugins: [new webpack.EnvironmentPlugin({ ...process.env })],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env'], // Include this preset
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
}
