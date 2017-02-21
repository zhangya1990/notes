var timeChunk = function(ary,fn,count){
    var obj,t;
    var len = ary.length;
    var start = function(){
        for(var i = 0;i<Math.min(count,len);i++){
            obj = ary.shift();
            fn(obj)
        }
    };
    return function(){
        t = setInterval(function(){
            if(ary.length === 0){
                return clearInterval(t);
            }
            start();
        },200)
    }
};