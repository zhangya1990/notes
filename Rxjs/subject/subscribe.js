const RX = require('rxjs');
/*
let observable = new RX.Observable.create((observer)=>{
    observer.next('come on');
    console.log('hello world');
    setTimeout(()=>{
       observer.next('wokaka')
    },1000)
});

observable.subscribe((x)=>{
    console.log(x)
});
*/
let observable = RX.Observable.from([10,20,30]);
let subscription = observable.subscribe(x=>console.log(x));
subscription.unsubscribe();