const Rx = require('rxjs');
const observable = Rx.Observable.from([1,2,3,4]);
const arrayObservable = observable.toArray();
arrayObservable.subscribe(x=>console.log(x))