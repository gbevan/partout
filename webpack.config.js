/*jslint node: true */
'use strict';

const path = require('path');

module.exports = {
//  entry: 'app/main.ts',
  output: {
    filename: 'bundle.js'
    //path: './dist'
  },
  devtool: 'source-map',
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    alias: {
      app: path.resolve(__dirname, 'app')
    }
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      {
        test: /\.s?css$/,
        loaders: ['to-string-loader', 'css-loader', 'sass-loader']
      },
      { test: /\.html$/, loader: 'html-loader' }
    ]
  }
};
