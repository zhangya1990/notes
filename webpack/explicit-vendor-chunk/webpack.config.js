var path = require("path");
var webpack = require("webpack");
var HTMLWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

//muti-compiler 同时编译dll及业务代码
module.exports = [
	{
		name: "vendor",
		entry: ["./vendor", "./vendor2"],
		output: {
			path: path.resolve(__dirname, "js"),
			filename: "vendor.js",
			library: "vendor_[hash]"
		},
		plugins: [
			new CleanWebpackPlugin(['js']),
			new webpack.DllPlugin({
				name: "vendor_[hash]",
				path: path.resolve(__dirname, "js/manifest.json")
			})
		]
	},
	{
		// compiler.name = option.name  name代表当前compiler对象的name
		name: "app",
		// compiler.dependencies = option.dependencies  dependencies 代表当前compiler的依赖
		//关键选项，指定需要的dll包，会在当前dependencies全部编译输出完成之后再编译业务代码
		dependencies: ["vendor"],
		entry: {
			pageA: "./pageA",
			pageB: "./pageB",
			pageC: "./pageC"
		},
		output: {
			path: path.join(__dirname, "js"),
			filename: "[name].js"
		},
		plugins: [
			new webpack.DllReferencePlugin({
				manifest: path.resolve(__dirname, "js/manifest.json")
			}),
			new HTMLWebpackPlugin({title:'muti-config'})
		]
	}
];
