var mult= function(){
    var a = 1;
    for(var i = 0,l = arguments.length;i<l;i++){
        a *= arguments[1];
    }
    return a;
};

var plus = function(){
    var a = 0;
    for(var i = 0,l = arguments.length;i<l;i++){
        a += arguments[1]
    }
    return a;
};

//创建缓存代理的工厂
var createProxyFactory = function(fn){
    var cache = {};
    return function(){
        var args = [].join.call(arguments,',');
        if(args in cache){
            return cache[args];
        }
        return cache[args] = fn.apply(this,arguments);
    }
};

var proxyMult = createProxyFactory(mult);
var proxyPlus = createProxyFactory(plus);

console.log(proxyMult(1,2,3,4));
//第二次从缓存直接获取（cache[args]），不需要计算
console.log(proxyMult(1,2,3,4));
console.log(proxyPlus(1,2,3,4));
