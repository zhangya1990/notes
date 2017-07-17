//asyncSubject将最新值返回，并且只在subect结束时将该值发送给所有的observer
const Rx = require('rxjs');
const subject = new Rx.AsyncSubject();

subject.subscribe({next:x=>console.log('subjectA'+x)});

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);
subject.next(5);

subject.subscribe({next:x=>console.log('subjectB'+x)});
subject.next(6);
subject.complete(7);