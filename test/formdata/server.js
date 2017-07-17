const http = require('http');
const url = require('url');
const express = require('express');
const multiparty = require('multiparty');
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var form = new multiparty.Form({
    uploadDir:__dirname
});
app.post('/update',(req,res)=>{
    form.parse(req,function(err,field,fles){
        console.log(field)
        console.log(fles)
        if(err){
            res.end('11111');
        }else{
            res.end('22222');
        }
    });
});

http.createServer(app).listen('8080',()=>{
    console.log("正在监听8080端口")
});
/*
http.createServer((req,res)=>{
    var method = req.method;
    var pathname = url.parse(req.url,true).pathname;
    console.log(pathname,method)
    if(pathname === '/update' && method.toLowerCase() === 'post'){
        console.log(2222222222222)
        form.parse(req,function(err,field,fles){
           if(err){
               res.end('11111');
           }else{
               res.end('22222');
           }
        });
    }
}).listen('8080',()=>{
    console.log("正在监听8080端口")
});*/
