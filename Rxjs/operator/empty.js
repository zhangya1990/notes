const Rx = require('rxjs');
const observable = Rx.Observable.empty().startWith(666);
observable.subscribe(x=>console.log(x),e=>console.error(e),()=>console.log('complete'));

/*
var interval = Rx.Observable.interval(1000);
var result = interval.mergeMap(x =>
    x % 2 === 1 ? Rx.Observable.of('a', 'b', 'c') : Rx.Observable.empty()
);
result.subscribe(x => console.log(x));*/
