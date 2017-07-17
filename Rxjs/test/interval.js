const Rx = require('rxjs');
const observable = Rx.Observable.interval().mapTo(x=>new Date());
observable.subscribe(val=>{
    console.log(val)
});
