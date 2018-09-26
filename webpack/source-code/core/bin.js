#!/usr/bin/env node

var path = require("path");

//
// Local version replace global one
try {
	var localWebpack = require.resolve(path.join(process.cwd(), "node_modules", "webpack", "bin", "webpack.js"));
	if(__filename !== localWebpack) {
		return require(localWebpack);
	}
} catch(e) {}
var yargs = require("yargs")
	.usage("webpack " + require("../package.json").version + "\n" +
		"Usage: https://webpack.js.org/api/cli/\n" +
		"Usage without config file: webpack <entry> [<entry>] <output>\n" +
        "Usage with config file: webpack");
        
//以下省略一堆解析命令行参数的方法
require("./config-yargs")(yargs);



// yargs will terminate the process early when the user uses help or version.
// This causes large help outputs to be cut short (https://github.com/nodejs/node/wiki/API-changes-between-v0.10-and-v4#process).
// To prevent this we use the yargs.parse API and exit the process normally
yargs.parse(process.argv.slice(2), (err, argv, output) => {

    //各种错误处理

    //各种解析参数


	function processOptions(options) {
		// 引入webpack，执行watch或run
	
		var webpack = require("../lib/webpack.js");

	
		var compiler;
		try {
			compiler = webpack(options);
		} catch(err) {
			
		}

		function compilerCallback(err, stats) {
			//...
		}
		if(firstOptions.watch || options.watch) {
			var watchOptions = firstOptions.watchOptions || firstOptions.watch || options.watch || {};
			compiler.watch(watchOptions, compilerCallback);
		} else
			compiler.run(compilerCallback);

	}

	processOptions(options);

});
