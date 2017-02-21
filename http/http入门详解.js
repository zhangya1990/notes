//http://www.ruanyifeng.com/blog/2016/08/http.html

//http1.1
//http1.1版本引入管道机制，即在同一个TCP连接里面，客户端可以同时发送多个请求，但是服务器还是会按照顺序回应请求

//Content-Type
//http1.1版的头信息必须是文本(ASCII编码),数据体可以是任何格式，因此，服务器回应的时候必须指定数据格式，这就是Content-Type字段的作用
//客户端在请求的时候，使用Accept字段声明自己可以接受哪些数据格式

//Content-Encoding
//Content-Encoding字段说明数据的压缩方法   zip|compress|deflate
//客户端在请求的时候，用Accept-Encoding字段说明自己可以接受的压缩方法

//Content-length:3496
//该字段用于声明本次回应的数据长度，当同一个TCP连接传送多个回应的时候，浏览器就会知道后面的字节属于下一个回应，从而区分数据包是属于哪一个回应

//Transfer-Encoding:chunked
// 表明回应将由数量未定的数据块组成，服务器采用“流模式”(stream)取代“缓存模式”(buffer)响应请求
//每个非空的数据块之前，会有一个16进制的数值，表示这个数据块的长度，最后是一个大小为0的块，表示本次回应的数据发送完成


//http2  多工通信
//http2是彻彻底底的二进制协议，头信息和数据体都是二进制，统称为“帧”，头信息帧和数据帧