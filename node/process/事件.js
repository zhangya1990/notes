//exit  uncaughtException
//exit  进程退出前发生的exit
//对于所有要在推出前完成某些任务的程序来说，exit事件是必不可少的，exit事件是在事件循环停止之后才激发的，所以不能在exit事件期间启动任何异步任务。退出码是回调函数的第一个参数，成功退出时退出码为0；
process.on('exit',(code)=>{
    console.log('Exiting with code :'+code)
});

//uncaughtException事件是进程发出的另一个特殊事件。uncaughtException事件只有一个参数，未捕获的Error对象。使用这个事件时应该在回调中包含process.exit(),否则会让程序处于不确定的状态中。

process.on('uncaughtException',(err)=>{
    console.error('got uncaught exception: ',err.message);
    process.exit(1);
});
