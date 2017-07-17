//测试发现，setInterval类似于多个setTimeout的组合，每经过interval的时间，将当前执行栈推送到下一个事件队列中，本例中长时间的同步循环会阻塞interval的执行。

var count = 0;
var timer1 = setInterval(()=>{
    count+=1;
    console.log('timers'+count)
},500)
setTimeout(()=>{
    console.log(222222)
    for(var i = 0;i<300000;i++){
        console.log(666)
    }
},2000)