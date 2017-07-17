//常见的writable
//客户端的http request
//服务端的http response
//fs write stream
//zlib
//crypto
//TCP sockets
//子进程的stdin
//process.stdout  process.stderr

//方法wirteStream.write(chunk,encoding,cb)  wirteStream.end(chunk,encoding,cb)
//write 方法的 callback 回调参数会在 chunk 被消费后（从缓存中移除后）被触发；end 方法的 callback 回调参数则在 Stream 结束时触发。
//通过 writable._write(chunk, enc, next) 方法在系统底层处理流写入的逻辑中，对数据进行处理。
//其中参数 chunk 代表写进来的数据；enc 代表编码的字符串；next(err) 则是一个回调函数，调用它可以告知消费者进行下一轮的数据流写入。

const Writable = require('stream').Writable;
const writable = Writable();

writable._write = (chunk,encoding,next)=>{
    process.stdout.write(chunk.toString().toUpperCase());
    process.nextTick(next)
};

writable.on('finish',()=>{
    process.stdout.write('DONE')
});

console.log(writable.write('a\n'));
writable.write('b\n');
writable.write('c\n');

writable.end();