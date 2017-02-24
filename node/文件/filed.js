//https://github.com/mikeal/filed

const http = require('http');
const filed = require('filed');
http.createServer((req,res)=>{
    req.pipe(filed('path/to/static/files')).pipe(res)
});