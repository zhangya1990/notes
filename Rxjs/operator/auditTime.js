// 功能： 在某个时间段内，忽略原始observable发射的值，该时间段由设定的
// duration的值(单位为ms)来决定，每隔一个设定的时间段，将从原始的
// observable发射最近的值。不断重复这个过程。
// const Rx = require('rxjs');
var clicks = Rx.Observable.fromEvent(document,'click');
var result = clicks.auditTime(1000);
result.subscribe(x=>console.log(x));