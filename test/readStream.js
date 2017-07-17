const fs = require('fs');
const path = require('path');
var stream = fs.createReadStream(path.join(__dirname,'/lodash.js'));
//创建了可读流就会触发data事件
stream.on('data',(trunk)=>{
    console.log(trunk)
});
stream.on('error',(err)=>{
    console.log(err.stack)
});
