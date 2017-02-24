//child_process  子进程不能直接访问彼此或父进程中的全局内存
//child_process模块提供给了一个被称为ChildProcess的新类，可以从启动子进程的父进程控制、结束，并将消息发送到子进程，process模块也是一个ChildProcess对象

//exec
//child_process.exec(command,[options],callback)
//command 命令行命令
//options 指定执行命令时使用的设置
/*
* cwd  指定子进程执行的当前工作目录
* env  环境变量，对象
* encoding  指定存储命令的输出缓冲区使用的编码
* maxBuffer  指定stdout和stderr输出缓冲区的大小，默认是200*1024
* timeout  指定父进程在杀掉子进程之前，如果子进程尚未完成，等待的毫秒数，默认是0，没有超时时间
* killSignal  指定终止子进程时使用的kill信号，默认值是SIGTERM
* */

//e.m.
/*const child_Process = require('child_process');
let options = {maxBuffer:100*1024,encoding:'utf8',timeout:5000};
let child = child_Process.exec('dir /b',options,(err,stdout,stderr)=>{
    if(err){
        console.log(err.stack);
        console.log(`Error Code: ${err.code}`);
        console.log(`Error Signal: ${err.signal}`);
    }
    console.log(`Result \n${stdout}`);
    if(stderr.length){
        console.log(`Errors: ${stderr}`)
    }

});
child.on('exit',(code)=>{
    console.log(`Completed with code: ${code}`)
});*/

//spawn
//spawn()和exec()/execFile()的主要区别是产生的进程中的stdin可以进行配置，并且stdout和stderr都是父进程中的Readable流。这意味着exec()和execFile()必须先执行完成，然后才能读取缓存区输出，但是，一旦一个spawn()进的输出数据已被写入，就可以读取

//fork
//派生时不能为子进程配合stdio，可以使用在ChildProcess对象中的send()机制在父进程和子进程之间通信。
//child_process.fork(modulePath,[args],[options])
/*
* modulePath参数是一个字符串，它指定会被新的nodejs实例启动的js文件路径
* args参数是一个数组，用于指定传递给node命令的命令行参数。
* options参数指定执行命令行命令是使用的设置
* callback(err,stdout,stderr)
* */
//options
//cwd 指定子进程的当前工作目录
//env  环境变量
//encoding 指定把数据写入输出流时和穿越send()IPC机制是使用的编码
//execPath  指定用于创建产生的nodejs进程的可执行文件
//silent 一个布尔值，如果为true，则将导致在派生的进程中的stdout和stderr不与父进程相关联，默认为false

//e.m.
const child_Process = require('child_process');
let options = {
    env:{user:'Brad'},
    encoding:'utf8'
};
function mkChild(){
    let child = child_Process.fork('./test.js',['wagaga'],options);
    child.on('message',(msg)=>{
        console.log(`served:${msg}`)
    });
    child.on('exit',(code)=>{
        console.log(`${child} exit with code ${code}`)
        // console.log(child)
    });
    return child
}
function sendMsg(child,msg){
    child.send({cmd:msg})
}
for(let i = 0;i<4;i++){
    let child = mkChild();
    sendMsg(child,i)
}