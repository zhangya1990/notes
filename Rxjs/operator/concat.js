const Rx = require('rxjs');
/*
 var timer = Rx.Observable.interval(1000).take(4);
 var sequence = Rx.Observable.range(1, 10);
 var result = Rx.Observable.concat(timer, sequence);
 result.subscribe(x => console.log(x));*/

var timer1 = Rx.Observable.interval(1000).take(10);
// var timer2 = Rx.Observable.interval(2000).take(6);
var timer3 = Rx.Observable.interval(500).take(10);
// var result = Rx.Observable.concat(timer1, timer2, timer3);
// var result = Rx.Observable.concat(timer1, timer3);
var mergeRes = timer1.concat(timer3);
// result.subscribe(x => console.log(x));
mergeRes.subscribe(x => console.log(x));