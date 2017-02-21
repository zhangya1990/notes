//AOP（面向切面编程）的主要作用是把一些跟核心业务逻辑模块无关的功能抽离出来，包括日志统计、安全控制、异常处理等。把这些功能抽离出来之后，再通过“动态植入”的方式掺入业务逻辑模块中，既可以保证业务逻辑模块的纯净和高内聚性，又可以方便的服用日志统计等功能模块
Function.prototype.before = function(){
    var _self = this;
    var beforeFn = [].pop.call(arguments);
    var arg = arguments;
    return function(){
        beforeFn.apply(this,arguments);
        return _self.apply(this,arg)
    }
}
Function.prototype.after = function(){
    var _self = this;
    var afterFn = [].pop.call(arguments);
    var arg = arguments;
    return function(){
        var ref = _self.apply(this,arg);
        afterFn.apply(this,arguments);
        return ref
    }
}
var func = function(){
    console.log(2)
}
func = func.before(function(){
    console.log(1)
}).after(function(){
    console.log(3)
});
func()
