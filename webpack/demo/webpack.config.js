
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry:'./app/index.js',//已多次提及的唯一入口文件
    output: {
        path: path.join(__dirname,'dist'),//打包后的文件存放的地方
        filename: "[name].js"//打包后输出文件的文件名
    },
    devtool: 'none',//便于调试生成source map
    devServer: {
        //需要配置package.json中"scripts": {
        // "test": "echo \"Error: no test specified\" && exit 1",
        // "start": "webpack",//配置后可用npm start打包webpack
        // "server": "webpack-dev-server --open"//开启本地服务器
        // },
        contentBase: "./public",//本地服务器所加载的页面所在的目录
        historyApiFallback: true,//不跳转
        inline: true,//实时刷新
        hot: true//react热加载，实时查看改变
        //port:8081//默认8080
    },
    module: {//配置babel转化ES6
        rules: [
            {
                test: /(\.jsx|\.js)$/,//一个用以匹配loaders所处理文件的拓展名的正则表达式（必须）
                use: {
                    loader: "babel-loader"//loader的名称（必须）
                    // options: {
                    //     presets: [
                    //         "es2015", "react"
                    //     ]
                    // }//在.babelrc中配置webpack会自动调用
                },
                exclude: /node_modules///include/exclude:手动添加必须处理的文件（文件夹）或屏蔽不需要处理的文件（文件夹）（可选）；
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader",
                        options: {//解决不同的模块中使用相同的类名造成冲突,解决css中class名的污染
                            modules: true
                        }
                    },
                    {
                        loader: "postcss-loader"
                    }
                ]


            },
            {
                test: /\.less$/,
                use:[
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader",
                        options: {//解决不同的模块中使用相同的类名造成冲突,解决css中class名的污染
                            modules: true
                        }
                    },
                    {
                        loader: "postcss-loader"
                    },
                    {
                        loader: "less-loader"
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.BannerPlugin('版权所有，翻版必究'),
        new HtmlWebpackPlugin({
            template: __dirname + "/index.html"//指定html模版
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),//为组件分配ID，通过这个插件webpack可以分析和优先考虑使用最多的模块，并为它们分配最小的ID
        // new webpack.optimize.UglifyJsPlugin({
        //     compress:false
        // }),//压缩js代码
        new ExtractTextPlugin("style.css")//分离css和js文件
    ],
};