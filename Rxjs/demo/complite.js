const Rx = require('rxjs');
const clicks = Rx.Observable.create(observer=>{
    timer = setTimeout(()=>{
        observer.next('gogo');
        observer.complete();
    })
    return ()=>{
        console.log('haha')
    }
});
var m = clicks.subscribe(x=>{
    console.log(x)
})

// setTimeout(()=>{
//     m.unsubscribe();
// },100)