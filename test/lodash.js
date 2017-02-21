const _ = require('lodash');
/*const Promise = require('bluebird');
Promise.resolve([22,33])
    .then(_)
    .call('groupBy',function(item){
        console.log(item)
    })*/

// console.log(_)

var __ = _();
// console.log(_)
console.log(__.some)
console.log(__ instanceof _.prototype.constructor)