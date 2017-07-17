//behaviorSubject会缓存当前subject的值，当有一个新的observer订阅subject时，会将缓存值立即发送给所有的observer
//replaySubject会缓存指定个数的值，当有一个新的observer订阅subject时，会将所有缓存值立即发送给新的observer
const Rx = require('rxjs');
const subject = new Rx.BehaviorSubject(0);

subject.subscribe({next:(x)=>{
    console.log(x)
}});

subject.next(1);
subject.next(2);
subject.next(3);

subject.subscribe({next:x=>console.log(x)});

subject.next(4);
subject.next(5);

subject.subscribe({next:x=>console.log(x)});