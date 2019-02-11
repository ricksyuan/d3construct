const path = require('path');

module.exports = {
  context: __dirname,
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        test: /\.json$/,
        use: {
          loader: 'json-loader',
        }
      },
      {
        test: /\.(s*)css$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'],
      }
    ]
  }
};