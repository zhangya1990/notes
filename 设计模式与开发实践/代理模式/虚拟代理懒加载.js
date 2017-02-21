var miniConsole = (function(){
    //此处的miniConsole为虚拟代理
    var cache = [];
    var handler = function(e){
        if(e.keyCode === 113){
            //当用户按下f2键的时候，惰性加载js文件
            var script = document.createElement('script');
            script.onload = function(){
                //加载完成之后将cache数组中存储的用户操作依次执行
                for(var i = 0,fn;fn = cache[i++];){
                    fn();
                }
            };
            script.src = 'miniConsole.js';
            document.getElementsByTagName('head')[0].appendChild(script);
            document.body.removeEventListener('keydown',handler,false);//确保只绑定一次
        }
    };
    document.body.addEventListener('keydown',handler,false);

    return {
        log:function(){
            //在真正的miniConsole加载之前，用户执行log方法，将操作暂存在cache数组中
            var args = arguments;
            cache.push(function(){
                //此处的miniConsole是js加载完成之后真正的miniConsole.log方法
                return miniConsole.log.apply(miniConsole,args);
            })
        }
    }
})();

//此处为虚拟代理的log方法，将操作存储在cache数组中
miniConsole.log(11);


//miniConsole.js中
miniConsole = {
    log:function(){
        //mimiConsole的真正代码
    }
}