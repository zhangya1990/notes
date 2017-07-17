//Readble Streams包括：
//客户端上的http response
//服务端的request
//fs read streams
//zlib streams
//crypto streams
//TCP sockets
//子进程的stdout和stderr
//process.stdin

/*//可读流在将其传入一个消耗对象之前都是可写的
const Readble = require('stream').Readable;
const res = Readble();
const str = 'zhang';
const l = str.length;
let i = 0;

//_read方法在系统底层读取数据流时触发
//在首次监听data事件后，readbleStream便会持续不断的调用_read(),通过触发data事件将数据输出，当数据全部被消耗时，触发end事件
res._read = ()=>{
    if(i === l){
        res.push(' is my name');
        return res.push(null);
    }
    res.push(str[i++]);
};
// res.pipe(process.stdout)
res.on('data',(chunk)=>{
    console.log(chunk.toString('utf8'))
});*/

const {Readable} = require('stream');
class ToReadable extends Readable{
    constructor(iterator){
        super();
        this.iterator = iterator;
    }
    _read(){
        const res = this.iterator.next();
        if(res.done){
            return this.push(null)
        }
        /*process.nextTick(()=>{
            this.push(res.value+'\n')
        })*/
        this.push(res.value+'\n')
    }
}
const gen = function*(a){
    let count = 5;
    let res = a;
    while(count--){
        res *= res;
        yield res;
    }
};
const readable = new ToReadable(gen(2));
readable.on('data',(chunk)=>{
    console.log(chunk.toString('utf8'))
});
readable.on('end',()=>console.log('readable stream ends~'))