const Rx = require('rxjs');
const observable = Rx.Observable.from([1,2,3]);
const observable1 = Rx.Observable.from('123');
const observable2 = Rx.Observable.of('123');
const observable3 = Rx.Observable.of([1,2,3]);
const observable4 = Rx.Observable.of([1,2,3]);
const observable5 = Rx.Observable.pairs({name:'zhang'});
const observable6 = Rx.Observable.repeat(1,5);
// observable.subscribe(x=>console.log(x))
// observable1.subscribe(x=>console.log(x))
// observable2.subscribe(x=>console.log(typeof x))
// observable3.subscribe(x=>console.log(x instanceof Array))
// observable4.subscribe(x=>console.log(x))
// observable5.subscribe(x=>console.log(x))
observable6.subscribe(x=>console.log(x))