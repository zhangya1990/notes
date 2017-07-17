// 只要往任意一个 stream 注册一个“data”事件监听器，它就会自动切换到“classic”模式，并按照旧的 API 去执行。
// classic 流可以当作一个带有 .pipe 接口的事件发射器（event emitter），当它要为消耗者提供数据时会发射“data”事件，当要结束生产数据时，则发射“end”事件。
// 另外只有当设置 Stream.readable 为 true 时，.pipe 接口才会将当前流视作可读流：

const Stream = require('stream');
const stream = new Stream();
stream.readable = true;

var c = 64;
var iv = setInterval(function(){
    if(++c > 75){
        clearInterval(iv);
        return stream.emit('end');
    }
    stream.emit('data',String.fromCharCode(c));
},100);
setTimeout(()=>{
    stream.pipe(process.stdout);
},3000)

// Classic readable streams 有 .pause() 和 .resume() 两个接口可用于暂停/恢复流的读取：