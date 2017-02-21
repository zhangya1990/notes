//将被执行的方法用setTimeout延迟一段时间再执行，如果该次延迟执行还没有完成，则忽略接下来调用该函数的请求
var throttle = function(fn,interval){
    var _self = fn,timer,firstTime = true;

    return function(){
        var args = arguments,_me = this;

        if(firstTime){
            _self.apply(_me,args);
            return firstTime = false;//是否是第一次引用
        }

        if(timer){//如果定时器还在，说明前一次调用尚未完成
            return false
        }

        timer = setTimeout(function(){
            clearTimeout(timer);
            timer = null;
            _self.apply(_me,args);
        },interval ||　500);
    };
};
window.onresize = throttle(function(){
    console.log(1)
},500)