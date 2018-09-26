//解析入口
"use strict";

const SingleEntryPlugin = require("./SingleEntryPlugin");
const MultiEntryPlugin = require("./MultiEntryPlugin");
const DynamicEntryPlugin = require("./DynamicEntryPlugin");

function itemToPlugin(context, item, name) {
	if(Array.isArray(item)) {
		return new MultiEntryPlugin(context, item, name);
	}
	return new SingleEntryPlugin(context, item, name);
}

module.exports = class EntryOptionPlugin {
	apply(compiler) {
		// @param context  (webpack config context)
		// @param entry  (webpack config entry)

		compiler.plugin("entry-option", (context, entry) => {

			if(typeof entry === "string" || Array.isArray(entry)) {
				//单入口，字符串或数组
				compiler.apply(itemToPlugin(context, entry, "main"));
			} else if(typeof entry === "object") {
				//多入口（对象）
				Object.keys(entry).forEach(name => compiler.apply(itemToPlugin(context, entry[name], name)));
			} else if(typeof entry === "function") {
				//函数入口
				compiler.apply(new DynamicEntryPlugin(context, entry));
			}
			return true;
		});
	}
};
