var webpack = require('webpack');
var path = require('path');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var HTMLWebpackPlugin = require('html-webpack-plugin');

var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;


module.exports = {
	entry: './example.js',
	output: {
		filename: '[name].[chunkhash].js',
		path: path.join(__dirname, 'build'),
		chunkFilename: '[name].[hash].js'
	},
	plugins: [
		new CleanWebpackPlugin(['build']),
		//提取公共模块
		//提取manifest模块
		new CommonsChunkPlugin({
			name: "manifest",
			filename: 'manifest.[hash].js',
			minChunks: Infinity
		}),
		//这样可以更细粒度的提取公共模块，避免最后生产的bundle中还有重复的部分，并且必须严格按照顺序，可以更换顺序查看效果
		//异步提取两次，第一次对所有产生的模块提取公共部分
		new CommonsChunkPlugin({
			async: true
		}),
		//第二次只提取存在于两个以上chunk中的公共模块
		new CommonsChunkPlugin({
			async: true,
			minChunks: 2
		}),
	]
};
