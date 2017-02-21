//用于将响应体压缩，对于响应头设置了cache-control的响应体不压缩
const compression = require('compression');
const express = require('express');

app.use(compression({
    chunkSize:16384,//The default value is zlib.Z_DEFAULT_CHUNK, or 16384.
    filter:shouldCompress,//指定是否压缩，参数为request和response
    level:8,//压缩类型 -1——9，-1为默认值，等同于6，0为不压缩，数值越大压缩质量越高，压缩时间越长
}));
function shouldCompress(req,res){
    if(req.headers['x-no-compression']){
        return false
    }
    return compression.filter(req,res)//默认filter函数
}

//与服务端推送一起使用，当数据推送完成时，最好调用res.flush()方法以确保所有数据都推送到客户端
app.get('/events',(req,res)=>{
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');

    let timer = setInterval(()=>{
        res.write('data:ping\n\n');

        res.flush();//关键
    },2000);

    res.on('close',()=>{
        clearInterval(timer)
    })
});