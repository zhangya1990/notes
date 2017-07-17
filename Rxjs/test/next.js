const Rx = require('rxjs');
const observable = new Rx.Observable.create((observer)=>{
    observer.next(1);
    observer.error('haha');
    observer.complete('')
});
observable.subscribe(x=>console.log(x),e=>console.error(e),()=>console.log('complete'))