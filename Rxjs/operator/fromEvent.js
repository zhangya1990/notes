const Rx = require('rxjs');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const observable = Rx.Observable.fromEvent(eventEmitter,'data',(...args)=>{
    return {foo:args[0],bar:args[1]}
});
observable.subscribe(x=>console.log(x),e=>console.error(e),()=>console.log('complete'));
eventEmitter.emit('data',['wu','ha'],'woca');