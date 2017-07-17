const Rx = require('rxjs');
var weight = Rx.Observable.of(70, 72, 76, 79, 75);
var height = Rx.Observable.of(1.76, 1.77, 1.78);

var bmi = Rx.Observable.combineLatest(weight,height,(w,h)=> {
    console.log(w,h)
    return w/(h*h)
});
bmi.subscribe(x=>console.log(x))