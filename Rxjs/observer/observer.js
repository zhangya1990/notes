const Rx = require('rxjs');
const selfObserver  ={
    next:(x)=>{
        console.log(x)
    }
}
const observable = new Rx.Observable((observer)=>{
    observer.next(1)
});
observable.subscribe(show);
function show(x){
    console.log(x)
}
function change(x){
    console.log(x+'0')
}
observable.subscribe(change);