const Rx = require('rxjs');
// var weight = Rx.Observable.of(70, 72, 76, 79, 75);
// weight.subscribe(x=>console.log(x))

var height = Rx.Observable.from([70, 72, 76, 79, 75]);
height.subscribe(x=>console.log(x))