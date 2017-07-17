const fs = require('fs');
fs.readdir(process.cwd(),(err,files)=>{
    console.log('');
    if(!files.length){
        return console.log('   No files to show!');
    }
    console.log('  Select which file or directory you want to see\n');

    ~function file(n){
        let filename = files[n];
        fs.stat(__dirname+'/'+filename,(err,stat)=>{
            if(stat.isDirectory()){
                console.log('    '+n+' \033[36m'+filename+'/\033[39m');
            }else{
                console.log('    '+n+' \033[90m'+filename+'/\033[39m');
            }
            n++;
            if(n === files.length){
                console.log('');
                process.stdout.write(' \033[33mEnter your choice: \033[39m');
                process.stdin.on('data',(data)=>{
                    console.log(data)
                })
            }else{
                file(n)
            }
        })
    }(0);
});