const BaseConfig = require('./webpack.base');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const merge = require('webpack-merge');

const devConfig = merge(BaseConfig, {
    output: {
        filename: 'flowchart.min.js',
        path: path.resolve(__dirname, 'examples/dist')
    },
    devServer: {
        contentBase: path.join(__dirname, 'examples'),
        compress: true,
        port: 9000,
        filename: 'flowchart.min.js',
        hot: true,
        hotOnly: true,
        index: 'index.html'
    },
    plugins: [
        // new webpack.DefinePlugin({
        //   'process.env': require('../config/dev.env')
        // }),
        // new webpack.HotModuleReplacementPlugin(),
        // new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
        // new webpack.NoEmitOnErrorsPlugin(),
        // // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
          filename: 'index.html',
          template: './examples/index.html',
          inject: 'head'
        }),
        // // copy custom static assets
        // new CopyWebpackPlugin([
        //   {
        //     from: path.resolve(__dirname, '../static'),
        //     to: config.dev.assetsSubDirectory,
        //     ignore: ['.*']
        //   }
    ]
})
module.exports = devConfig