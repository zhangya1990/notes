const Rx = require('rxjs');
const observable = Rx.Observable.range(0,10);
observable.subscribe(x=>console.log(x),e=>console.error(e),()=>console.log('complete'));