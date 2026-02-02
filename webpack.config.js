const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/module.ts',
  output: {
    filename: 'module.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'amd',
    publicPath: '/',
  },
  externals: ['lodash', 'react', 'react-dom', '@grafana/data', '@grafana/ui', '@grafana/runtime'],
  module: {
    rules: [{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/plugin.json', to: '.' },
        { from: 'src/img', to: 'img', noErrorOnMissing: true },
        { from: 'README.md', to: '.', noErrorOnMissing: true },
        { from: 'LICENSE', to: '.', noErrorOnMissing: true },
      ],
    }),
  ],
};
