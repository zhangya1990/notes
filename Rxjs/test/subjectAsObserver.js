const Rx = require('rxjs');
const subject = new Rx.Subject();
subject.subscribe({
    next:v=>console.log(v)
})
subject.subscribe({
    next:l=>console.log(2+l)
})

const source = Rx.Observable.from([1,2,3]);
source.subscribe(subject)