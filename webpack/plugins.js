const path = require('path');
const webpack = require('webpack');
//webpack常用插件配置
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const TransferWebpackPlugin = require('transfer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

//以指定文件为模板创建html文件
new HtmlWebpackPlugin({
    title: 'My App',
    filename: 'admin.html',//输出文件名称
    template: 'header.html',//模板文件
    inject: 'body',//把编译完成的文件注入到哪里（head,body）
    favicon: './images/favico.ico',//添加favicon
    minify: {//压缩
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        collapseBooleanAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
    },
    hash: true,//是否添加hash
    cache: false,//是否缓存
    showErrors: false,//是否显示错误
    chunks:['app'],//要添加的chunk
    xhtml: false
});

//提取所有的css文件，分离出独立的css
new ExtractTextWebpackPlugin();
let extractCSS = new ExtractTextPlugin('stylesheets/[name].css');
let extractLESS = new ExtractTextPlugin('stylesheets/[name].less');

module.exports = {
    module: {
        loaders: [
            {test: /\.scss$/i, loader: extractCSS.extract('style','css?modules!sass')},
            {test: /\.less$/i, loader: extractLESS.extract('style','css?modules!less')},
        ]
    },
    plugins: [
        extractCSS,
        extractLESS
    ]
};

//这两个感觉没什么卵用
//将指定文件夹下的文件复制到指定的目录
new TransferWebpackPlugin([
    {from: 'www'}
], path.resolve(__dirname, 'src'));
//拷贝资源文件(把public里的内容全部拷贝到编译目录)
new CopyWebpackPlugin([
    {from: __dirname + '/src/public'}
]);


//内置插件

//为组件分配id，通过这个插件webpack可以分析和优先考虑使用最多的模块，并未他们分配最小的id
new webpack.optimize.OccurenceOrderPlugin();

//压缩混淆js代码
new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,//生成source文件，会导致编译过程变慢，默认为true
    test: /\w/,//使用一个或多个正则表达式来过滤要处理的文件
    include: /\w/,//同上
    exclude: /\w/,//同上
    mangle: true || {//通过设置except数组来防止变量被更改
        except: ['$', 'exports', 'require']
    },
    compress: {//去除警告部分
        warning: false
    }
});

//跳过编译时出错的代码记录，使编译后运行时的包不会发生错误
new webpack.NoErrorsPlugin();

//热替换(修改组件代码后，自动刷新实时预览修改后的效果)
new webpack.HotModuleReplacementPlugin();

//有些js有自己的依赖库，并且这些库可能有交叉的依赖，DedupePlugin可以找出它们并合并重复的依赖
new webpack.optimize.DedupePlugin();

//定义标识符，当遇到指定标识符的时候，自动加载模块
new webpack.ProvidePlugin({
    $: 'jquery'
});

//指定环境变量
new webpack.DefinePlugin({
    'process.env': JSON.stringify(process.env.NODE_ENV || 'development')
});

//抽取代码中的公共模块，打包到一个独立的文件中
module.exports = {
    entry: {
        vendor: ['jquery', 'vue'],
        app: './app.js'
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vender',//和入口文件的chunk相对应
            filename: 'vender.js',//导出的文件的名称
            minChunks: Infinity || 51200,// This plugin prevents Webpack from creating chunks that would be too small to be worth loading separately
        })
    ]
};

//自动补全css前缀
const autoprefixer = require('autoprefixer');
module.exports = {
    //其他配置这里就不写了

    module: {
        loaders: [
            {
                test: /\.css$/,
                //在原有基础上加上一个postcss的loader就可以了
                loaders: ['style-loader', 'css-loader', 'postcss-loader']
            }
        ]
    },
    postcss: [
        autoprefixer({
            browsers: ['last 3 versions']
        })
    ]
};
