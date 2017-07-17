//并行运行所有可观察序列并收集其最后的元素
const Rx = require('rxjs');
var source = Rx.Observable.forkJoin(
    Rx.Observable.of(42),
    Rx.Observable.range(0, 10),
    Rx.Observable.from([1,2,3]),
    Rx.Observable.fromPromise(Promise.resolve(56))
);
var subscription = source.subscribe(
    x => console.log(`onNext: ${x}`),
    e => console.log(`onError: ${e}`),
    () => console.log('onCompleted')
);