const express = require('express');
const Stream = require('stream');
const multiparty = require('multiparty');
const app = express();

let form = new multiparty.Form({
    uploadDir:__dirname
});

app.get('/',(req,res)=>{
    res.end('hello world')
});
app.post('/json',(req,res)=>{
    // console.log(req.headers)
    // console.log(req.socket)
});
app.post('/buffer',(req,res)=>{
    // console.log(req.headers)
    let buffer;
    req.on('data',(chunk)=>{
        if(!buffer){
            buffer = chunk
        }else{
            buffer = Buffer.concat([buffer,chunk],Buffer.byteLength(buffer)+Buffer.byteLength(chunk));
        }
        console.log(chunk.toString()+'\n\n')
    });
    req.on('end',()=>{
        // console.log(buffer);
        // console.log(buffer.toString());
        res.end();
    })

    /*form.parse(req,(err,field,files)=>{
        console.log(files)
        console.log(files instanceof Stream.Readable)
        console.log(files.constructor)
    })*/

});

app.listen('8080',()=>{
    console.log('正在监听8080端口')
})