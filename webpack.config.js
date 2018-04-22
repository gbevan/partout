/*jslint node: true */
'use strict';

var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var CompressionPlugin = require("compression-webpack-plugin");

const webpack = require('webpack');
const path = require('path');

module.exports = {
//  entry: 'app/main.ts',
  output: {
    filename: 'bundle.js'
    //path: './dist'
  },
//  devtool: 'source-map',
  devtool: 'cheap-module-source-map',
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
      {
        test: /app\/.+\.ts$/,
        exclude: /(node_modules|\.spec\.ts$)/,
        loader: 'istanbul-instrumenter-loader',
        enforce: 'post'
      },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      {
        test: /\.s?css$/,
        loaders: ['to-string-loader', 'css-loader', 'sass-loader']
      },
      { test: /\.html$/, loader: 'html-loader' }
    ]
  },
  plugins: [
    /*
    new BundleAnalyzerPlugin({
      defaultSizes: 'stat'
      //defaultSizes: 'parsed'   // not yet supported
      //defaultSizes: 'gzip'   // not yet supported
    }),
    */
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

    // Tree shake and compress
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      },
      sourceMap: false
    }),
    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    }),
  ],
  watch: true
};
