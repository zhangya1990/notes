const Rx = require('rxjs');
const s1 = Rx.Observable.interval(1000).take(10);
const s2 = Rx.Observable.interval(2000).take(6);
const s3 = Rx.Observable.interval(500).take(30);

const source = Rx.Observable.merge(s1,s2,s3,2);

source.subscribe(x=>console.log(x))