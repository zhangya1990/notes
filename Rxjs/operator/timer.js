const Rx = require('rxjs');
const s1 = Rx.Observable.timer(1000,500).startWith(4).take(6);
const s2 = Rx.Observable.timer(2000,1000);

var subscribetion = s1.concat(s2).subscribe(x=>{console.log(x);x === 19 && subscribetion.unsubscribe()})