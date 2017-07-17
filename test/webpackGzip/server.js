const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const gunzipStream = zlib.createGunzip();

function redirectZip(req,res,next){
    let url = req.url;
    let reg = /\.js$/;
    if(reg.test(url)){
        let sep = path.sep;
        let fileName = url.split(sep).pop();
        let targetPath = path.join(__dirname,fileName),
            sourcePath = path.join(__dirname,fileName+'.gz');
        if(!fs.existsSync(targetPath)){
            let rs = fs.createReadStream(sourcePath),
                ws = fs.createWriteStream(targetPath);
            rs.pipe(gunzipStream).pipe(ws);
            gunzipStream.on('end',()=>{
                gunzipStream.flush();
                fs.unlinkSync(sourcePath);
                res.sendFile(targetPath);
            })
        }else{
            res.sendFile(targetPath)
        }
    }else{
        next()
    }
}
let n = 0;
app.use((req,res,next)=>{
    console.log(n++);
    console.log(req.url);
    next()
});
app.use(redirectZip);

app.use(express.static(__dirname));

app.listen('8080',()=>{
    console.log('正在监听8080端口')
});
