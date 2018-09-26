
"use strict";
const SingleEntryDependency = require("./dependencies/SingleEntryDependency");

class SingleEntryPlugin {
	constructor(context, entry, name) {
		this.context = context;
		this.entry = entry;
		this.name = name;
	}

	apply(compiler) {
		compiler.plugin("compilation", (compilation, params) => {
			//'compilation'阶段 给compilation对象添加 module工厂函数
			const normalModuleFactory = params.normalModuleFactory;

			compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);
		});

		compiler.plugin("make", (compilation, callback) => {
			//'make' 阶段，解析入口，开始构建
			const dep = SingleEntryPlugin.createDependency(this.entry, this.name);
			compilation.addEntry(this.context, dep, this.name, callback);
		});
	}

	static createDependency(entry, name) {
		const dep = new SingleEntryDependency(entry);
		dep.loc = name;
		return dep;
	}
}

module.exports = SingleEntryPlugin;
