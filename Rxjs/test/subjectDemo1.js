const Rx = require('rxjs');
const subject = new Rx.Subject();
subject.subscribe({
    next:v=>console.log(v)
})
subject.subscribe({
    next:v=>console.log(2+v)
})
subject.next('gogo')