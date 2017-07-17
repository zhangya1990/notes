//将一个数组、类数组(字符串也可以)，Promise、可迭代对象，类可观察
//对象、转化为一个Observable
const Rx = require('rxjs');
// const observable = Rx.Observable.from(new Set([{obj:'name'},[1,2,3]]));
// const observable = Rx.Observable.from(new Map([[{obj:'name'},[1,2]],[1,4]]));
const obj = {
    [Symbol.iterator]:function(){
        let i = 0;
        return {
            next(){
                i++;
                return {
                    value:i,
                    done:i>10
                }
            }
        }
    }
}
const observable = Rx.Observable.from(obj);
observable.subscribe(x=>console.log(x),e=>console.error(e),()=>console.log('complete'));