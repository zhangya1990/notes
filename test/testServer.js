const path = require('path');
const express = require('express');

const app = express();



app.use((req,res,next)=>{
    console.log(Object.keys(res))
    console.log(res._header)
    console.log(res.locals)
    next();
})

app.use(express.static(__dirname));


app.listen('8080',function(){
    console.log('正在监听8080端口')
})

