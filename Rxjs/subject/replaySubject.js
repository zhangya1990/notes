const Rx = require('rxjs');
/*const subject = new Rx.ReplaySubject(4);

subject.subscribe({next:x=>console.log('subjectA'+x)});

subject.next(0);
subject.next(1);
subject.next(2);

subject.subscribe({next:x=>console.log('subjectB'+x)});

subject.next(3);
subject.next(4);
subject.next(5);

subject.subscribe({next:x=>console.log('subjectC'+x)});*/

//replaySubject还可以指定第二个参数，指定距离最新的订阅间隔的时间，只有在这个时间内的值会被缓存，单位是毫秒
let newSubject = new Rx.ReplaySubject(100,500);
newSubject.subscribe({next:x=>console.log('subjectX'+x)});

let i = 0
let timer = setInterval(()=>{
    newSubject.next(i++)
},200);

setTimeout(()=>{
    newSubject.subscribe({next:x=>console.log('subjectY'+x)})
    clearInterval(timer)
},1100);
