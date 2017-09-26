//功能： 在某个持续时间段内忽略原始observable发射的值 ，该方法的参数为
// 一个函数，该函数需返回一个决定持续时长的observable或者promise。之后
// 从原始observable发射最近的值，不断重复这个过程。
// const Rx = require('rxjs');
var clicks = Rx.Observable.fromEvent(document,'click').map(e=>({x:e.clientX,y:e.clientY}));
var result = clicks.audit(e=>Rx.Observable.interval(1000));
result.subscribe(x=>console.log(x));