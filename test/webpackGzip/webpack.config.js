const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    entry:path.join(__dirname,'test.js'),
    output:{
        filename:'[name].js',
        path:path.join(__dirname,'dist')
    },
    module:{
        loaders:[
            {
                test:/\.js$/,
                loader:'babel-loader'
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            filename:'index.html'
        }),
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            minRatio: 0.8
        })
    ]
};