//Transfrom Streams 在duplex的基础上进行扩展，可以把写入的数据和输出的数据 ，通过_transform链接起来
//常见的transform stream有

//crypto streams
//zlib streams

const {Transform} = require('stream');
class SetName extends Transform{
    constructor(name,option){
        super(option);
        this.name = name || '';
    }
    _transform(chunk,encoding,next){
        let res = chunk.toString();
        this.push(res + this.name + '\n');
        next();
    }
}
let transform = new SetName('zhang');
transform.on('data',(chunk)=>{
    process.stdout.write(chunk.toString())
});

transform.write('my name is ');
transform.end('here is ');

//_transform 是 Transform Streams 的内置方法，所有 Transform Streams 都需要使用该接口来接收输入和处理输出，且该方法只能由子类来调用。
//transform._transform(chunk, encoding, callback)

// 第一个参数表示被转换（transformed）的数据块（chunk），除非构造方法 option 参数（可选）传入了 “decodeString : false”，否则其类型均为 Buffer；
//
// 第二个参数用于设置编码，但只有当 chunck 为 String 格式（即构造方法传入 “decodeString : false”参数）的时候才可配置，否则默认为“buffer”；
//
// 第三个参数 callback 用于在 chunk 被处理后调用，通知系统进入下一轮 _transform 调用。该回调方法接收两个可选参数 —— callback([error, data])，其中的 data 参数可以将 chunck 写入缓存中（供更后面的消费者去消费）：
//
// transform.prototype._transform = function(data, encoding, callback){
//     this.push(data);
//     callback()
// };
//等价于
// transform.prototype._transform = function(data, encoding, callback){
//     callback(null, data)
// };
// Transform Streams 还有一个 _flush(callback) 内置方法，它会在没有更多可消耗的数据时、在“end”事件之前被触发，而且会清空缓存数据并结束 Stream。
//
// 该内置方法同样只允许由子类来调用，而且执行后，不能再调用 .push 方法。