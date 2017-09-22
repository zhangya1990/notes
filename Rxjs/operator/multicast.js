// const Rx = require('rxjs');
// const source = Rx.Observable.from([1,2,3,4]);
// const subject = new Rx.Subject();
// const multicastable = source.multicast(subject);

// multicastable.subscribe({
//     next:v=>console.log(v)
// })
// multicastable.subscribe({
//     next:l=>console.log(l+'aa')
// })
// multicastable.connect();

// console.log(multicastable)


const Rx = require('rxjs');
const source = Rx.Observable.interval(500);
const subject = new Rx.Subject();
const multicastable = source.multicast(subject).refCount();

const observable1 = multicastable.subscribe({
    next(a){console.log(a)}
});

// multicastable.connect();

let observable2;
setTimeout(()=>{
    observable2 = multicastable.subscribe({
        next(b){
            console.log(b)
        }
    })
},800)

setTimeout(()=>{
    observable1.unsubscribe();
},1600)

setTimeout(()=>{
    observable2.unsubscribe();
},2100)


