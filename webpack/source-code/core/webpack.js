/* 
    webpack 启动代码
*/
"use strict";

const Compiler = require("./Compiler");
const MultiCompiler = require("./MultiCompiler");
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const WebpackOptionsDefaulter = require("./WebpackOptionsDefaulter");
const validateSchema = require("./validateSchema");
const WebpackOptionsValidationError = require("./WebpackOptionsValidationError");
const webpackOptionsSchema = require("../schemas/webpackOptionsSchema.json");

function webpack(options, callback) {
    //此处扒掉options错误验证
    
    let compiler;
    //options如果是数组，调用 MultiCompiler
	if(Array.isArray(options)) {
		compiler = new MultiCompiler(options.map(options => webpack(options)));
	} else if(typeof options === "object") {
		// 解析options，并且添加各种默认配置参数
		new WebpackOptionsDefaulter().process(options);

		compiler = new Compiler();
		compiler.context = options.context;
		compiler.options = options;
        new NodeEnvironmentPlugin().apply(compiler);
        
        //初始化webpack config文件中的plugins，挂载各种生命周期钩子
		if(options.plugins && Array.isArray(options.plugins)) {
			compiler.apply.apply(compiler, options.plugins);
        }
        //首先触发俩内置钩子 'environment' 'after-environment'
		compiler.applyPlugins("environment");
        compiler.applyPlugins("after-environment");

        //挂载一系列（一万个）内置生命周期钩子，添加入口，并解析
		compiler.options = new WebpackOptionsApply().process(options, compiler);
	} else {
		throw new Error("Invalid argument: options");
    }
    
    //如果包含回调函数，直接执行watch方法，或者run方法
	if(callback) {
		if(typeof callback !== "function") throw new Error("Invalid argument: callback");
		if(options.watch === true || (Array.isArray(options) && options.some(o => o.watch))) {
			const watchOptions = Array.isArray(options) ? options.map(o => o.watchOptions || {}) : (options.watchOptions || {});
			return compiler.watch(watchOptions, callback);
		}
		compiler.run(callback);
    }
    
    //返回compiler对象
	return compiler;
}
exports = module.exports = webpack;

webpack.WebpackOptionsDefaulter = WebpackOptionsDefaulter;
webpack.WebpackOptionsApply = WebpackOptionsApply;
webpack.Compiler = Compiler;
webpack.MultiCompiler = MultiCompiler;
webpack.NodeEnvironmentPlugin = NodeEnvironmentPlugin;
webpack.validate = validateSchema.bind(this, webpackOptionsSchema);
webpack.validateSchema = validateSchema;
webpack.WebpackOptionsValidationError = WebpackOptionsValidationError;

function exportPlugins(obj, mappings) {
	Object.keys(mappings).forEach(name => {
		Object.defineProperty(obj, name, {
			configurable: false,
			enumerable: true,
			get: mappings[name]
		});
	});
}

