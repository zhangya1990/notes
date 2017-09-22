const Rx = require('rxjs');
const s1 = Rx.Observable.of({name:'zhang'});
const s2 = Rx.Observable.of({sex:'male'});
const s3 = Rx.Observable.of({age:69});

const source = Rx.Observable.zip(s1,s2,s3,(a,b,c)=>Object.assign(a,b,c)).subscribe(x=>console.log(x))