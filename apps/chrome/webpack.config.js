const path = require('node:path')
const webpack = require('webpack')

module.exports = {
  entry: {
    auth: './src/app/auth/index.tsx',
    background: './src/app/background/index.ts',
    content: './src/app/editor/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'extension/dist'),
    filename: '[name].js',
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
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  externals: {
    chrome: 'chrome',
  },
}
