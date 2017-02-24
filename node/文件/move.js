//该方法只适用于文件
const fs = require('fs');
module.exports = function move(oldPath,newPath,callback){
    fs.rename(oldPath,newPath,(err)=>{
        if(err){
            if(err.code === 'EXDEV'){
                copy()
            }else{
                callback(err)
            }
            return
        }
        callback();
    });
    function copy(){
        const readStream = fs.createReadStream(oldPath);
        const writeStream = fs.createWriteStream(newPath);
        readStream.on('error',callback);
        writeStream.on('error',callback);
        readStream.on('close',()=>{
            //只能移除文件
            fs.unlink(oldPath,callback);
        });
        readStream.pipe(writeStream)
    }
};
