//定时器对象调用unref方法，将该定时器在当前事件循环队列中移除，如果事件循环队列中再无其他事件存在，事件循环队列为空，process直接退出，否则事件循环不受影响，程序继续执行，ref方法则将定时器恢复到事件循环队列中。


/*
var timer = setInterval(function () {
    console.log(new Date, 1)
}, 1000)
var fn = function () {
    console.log(new Date, 2)
}
var timer2 = setInterval(fn, 1000)
timer2.unref()
timer.unref()
timer.ref()*/


var timer1 = setTimeout(function(){
    console.log(new Date, 1);
}, 1000);
// setTimeout=>uv_timer_start(timer1)  active_handles = 1

var timer2 = setInterval(function(){
    console.log(new Date, 2);
}, 1000);

timer2.unref();
