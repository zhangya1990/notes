const Rx = require('rxjs');
const source = Rx.Observable.from([1, 2, 3, 4]);
function delayFn(d) {
    return Rx.Observable.delay(d * 1000);
}
const delaySource = source.delayWithSelector(delayFn);
delaySource.subscribe(x => console.log(x));



