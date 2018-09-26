//api 源码目录  \node_modules\webpack\lib\HotModuleReplacement.runtime.js

//通过代码注入的方式生成api

function hotCreateModule(moduleId) { 
    var hot = {
        // private stuff
        _acceptedDependencies: {},
        _declinedDependencies: {},
        _selfAccepted: false,
        _selfDeclined: false,
        _disposeHandlers: [],
        _main: hotCurrentChildModule !== moduleId,

        // Module API
        active: true,
        accept: function(dep, callback) {
            if(typeof dep === "undefined")
                hot._selfAccepted = true;
            else if(typeof dep === "function")
                hot._selfAccepted = dep;
            else if(typeof dep === "object")
                for(var i = 0; i < dep.length; i++)
                    hot._acceptedDependencies[dep[i]] = callback || function() {};
            else
                hot._acceptedDependencies[dep] = callback || function() {};
        },
        decline: function(dep) {
            if(typeof dep === "undefined")
                hot._selfDeclined = true;
            else if(typeof dep === "object")
                for(var i = 0; i < dep.length; i++)
                    hot._declinedDependencies[dep[i]] = true;
            else
                hot._declinedDependencies[dep] = true;
        },
        dispose: function(callback) {
            hot._disposeHandlers.push(callback);
        },
        addDisposeHandler: function(callback) {
            hot._disposeHandlers.push(callback);
        },
        removeDisposeHandler: function(callback) {
            var idx = hot._disposeHandlers.indexOf(callback);
            if(idx >= 0) hot._disposeHandlers.splice(idx, 1);
        },

        // Management API
        check: hotCheck,
        apply: hotApply,
        status: function(l) {
            if(!l) return hotStatus;
            hotStatusHandlers.push(l);
        },
        addStatusHandler: function(l) {
            hotStatusHandlers.push(l);
        },
        removeStatusHandler: function(l) {
            var idx = hotStatusHandlers.indexOf(l);
            if(idx >= 0) hotStatusHandlers.splice(idx, 1);
        },

        //inherit from previous dispose call
        data: hotCurrentModuleData[moduleId]
    };
    hotCurrentChildModule = undefined;
    return hot;
} 

//在 \node_modules\webpack\lib\HotModuleReplacementPlugin.js (即热更新插件) 中，mainTemplate生成入口文件时，会生成一个module对象，其hot属性，即module.hot API，因此，开发阶段代码中的 module.hot.accept 等代码才可用
compiler.plugin("compilation", (compilation, params) => {
    // ...

    compilation.mainTemplate.plugin("module-obj", function(source, chunk, hash, varModuleId) {
        return this.asString([
            `${source},`,
            `hot: hotCreateModule(${varModuleId}),`,
            "parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),",
            "children: []"
        ]);
    });

    // ...
}

