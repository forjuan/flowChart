const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'flowchart.min.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimizer: [
        new OptimizeCssAssetsPlugin({})
      ]
  },
  plugins: [
        new CleanWebpackPlugin(['dist']),
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.min\.css$/g,
            cssProcessor: require('cssnano'),
            cssProcessorPluginOptions: {
              preset: ['default', { discardComments: { removeAll: true } }],
            },
            canPrint: true
          }),
        new MiniCssExtractPlugin({
        filename: "flowchart.min.css",
        })
    ],
  module: {
    rules: [
        {
            test: /\.css$/,
            use: [ MiniCssExtractPlugin.loader, 'css-loader' ]
        }
    ]
 }
 
};