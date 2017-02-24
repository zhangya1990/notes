const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
let cache = {};
let chatServer = require('./lib/chat_server');


let sendMsg = {
    send404(res){
        res.writeHead(404,{'content-type':'text/plain'});
        res.write('Error 404 : resource not found.');
        res.end();
    },
    sendFile(res,filePath,fileContents){
        res.writeHead(200,{
            'content-type':mime.lookup(path.basename(filePath))
        });
        res.end(fileContents)
    }
};
function serverStatic(res,cache,absPath){
    if(cache[absPath]){
        sendMsg.sendFile(res,absPath,cache[absPath]);
    }else{
        fs.exists(absPath,(exists)=> {
            if(exists){
                fs.readFile(absPath,(err,data)=>{
                    if(err){
                        sendMsg.send404(res)
                    }else{
                        cache[absPath] = data;
                        sendMsg.sendFile(res,absPath,data);
                    }
                });
            }else{
                sendMsg.send404(res);
            }
        })
    }
}

let server = http.createServer((request,response)=>{
    let filePath = null;
    if(request.url == '/'){
        filePath = 'public/index.html';
    }else{
        filePath = 'public'+request.url;
    }
    let absPath = './'+filePath;
    serverStatic(response,cache,absPath)
});
server.listen(3000,()=>{
    console.log('正在监听3000端口')
});

chatServer.listen(server);