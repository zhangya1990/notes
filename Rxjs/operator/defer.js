//惰性产生一个observable
const Rx = require('rxjs');
const observable = new Rx.Observable.defer(()=>{
    return Rx.Observable.from([1,2,3,4])
});
observable.subscribe(
    x=>console.log(x),
    e=>console.error(e),
    ()=>console.log('complete')
);